import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createTimeline, createScope, onScroll, utils } from 'animejs'
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useCountUp } from '../hooks/useCountUp'
import { useHealthData } from '../context/HealthDataContext'
import {
  CATEGORIES, indicators, positiveUpKeys,
} from './snapshotData'
import InfoTooltip from './InfoTooltip'
import { HERO } from '../assets/images'

// ── Helper: get latest data point ──
function getLatest(indicator) {
  if (!indicator?.data?.length) return null
  return indicator.data[indicator.data.length - 1]
}

// ── Snapshot Card ──
function getTrendTooltip(key, prev, indicator) {
  const baseline = indicator?.trendBaseline
  const baselineNote = baseline ? ` Historical baseline: ${baseline}.` : ''
  const unit = indicator?.unit === 'S$B' ? `S$${prev.value}B` : `${prev.value}${indicator?.unit || ''}`
  if (key === 'hypertension_prevalence') {
    return `Compared to ${prev.year} (${unit}). Note: methodology changed in 2020 — the jump may not reflect a real increase.${baselineNote}`
  }
  const isPositiveUp = positiveUpKeys.has(key)
  const direction = isPositiveUp ? 'Higher is better' : 'Lower is better'
  return `Compared to ${prev.year} (${unit}). ${direction}.${baselineNote}`
}

function SnapshotCard({ indicatorKey, onSelect, healthData, forceVisible }) {
  const [ref, isVisible] = useScrollAnimation(0.2)
  const visible = forceVisible || isVisible
  const indicator = healthData[indicatorKey]
  if (!indicator) return null

  const data = indicator.data
  const latest = data[data.length - 1]
  const previous = data[data.length - 2]
  const change = previous
    ? ((latest.value - previous.value) / previous.value * 100).toFixed(1)
    : null
  const isUp = change > 0
  const countValue = useCountUp(latest.value, 1500, visible)
  const displayValue = countValue.toFixed(1)
  const isPositiveUp = positiveUpKeys.has(indicatorKey)
  const trendColor = isPositiveUp
    ? (isUp ? '#1E8E3E' : '#DC2626')
    : (isUp ? '#DC2626' : '#1E8E3E')
  const indicatorMeta = indicators.find(i => i.key === indicatorKey)
  const categoryColor = CATEGORIES.find(c => c.id === indicatorMeta?.category)?.color || '#5370E0'
  const tooltipContent = indicator.tooltip || indicator.description || ''

  return (
    <motion.div
      ref={ref}
      className="snapshot-card card p-3 md:p-5 cursor-pointer hover:card-hover focus:outline-none"
      style={{
        WebkitTapHighlightColor: 'transparent',
        ...(forceVisible ? { opacity: 1 } : { opacity: 0, transform: 'translateY(24px)' }),
      }}
      initial={false}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      onClick={() => onSelect(indicatorKey)}
    >
      <div className="flex items-start gap-1">
        <p className="text-sm text-secondary font-body truncate flex-1">{indicator.label}</p>
        {tooltipContent && <InfoTooltip content={tooltipContent} size={13} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-mono font-semibold text-primary">
          {visible ? displayValue : '0'}
        </span>
        <span className="text-sm text-secondary font-mono">{indicator.unit}</span>
      </div>
      {change !== null && previous && (
        <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: trendColor }}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span className="font-mono">{isUp ? '+' : ''}{change}%</span>
          <InfoTooltip content={getTrendTooltip(indicatorKey, previous, indicator)} size={11} />
        </div>
      )}
      <div className="mt-3 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="value" stroke={categoryColor} strokeWidth={1.5} dot={false} isAnimationActive={visible} animationDuration={1500} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[10px] text-secondary/40 font-mono">
        {data[0].year}–{latest.year}
      </p>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════
export default function HeroLensSection({ onSelectIndicator, onSettled }) {
  // ── Refs ──
  const containerRef = useRef(null)
  const stickyRef = useRef(null)
  const pillRefs = useRef([])
  const heroTextRef = useRef(null)
  const heroImageRef = useRef(null)
  const scopeRef = useRef(null)
  const transitionCompleteRef = useRef(false)

  // ── State ──
  const [isMobile, setIsMobile] = useState(false)
  const [prefersReduced, setPrefersReduced] = useState(false)
  const [transitionComplete, setTransitionComplete] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [currentStat, setCurrentStat] = useState(0)

  const { healthData, dataStatus } = useHealthData()

  const filteredIndicators = activeCategory === 'all'
    ? indicators
    : indicators.filter(i => i.category === activeCategory)

  // ── Rotating hero stats ──
  const stats = useMemo(() => {
    const le = getLatest(healthData.life_expectancy)
    const dm = getLatest(healthData.diabetes_prevalence)
    const ghe = getLatest(healthData.govt_health_expenditure)
    const sm = getLatest(healthData.daily_smoking_rate)
    return [
      { label: 'Life expectancy', value: le ? `${le.value} years` : '83.5 years' },
      { label: 'Diabetes prevalence', value: dm ? `${dm.value}% of adults` : '8.5% of adults' },
      { label: 'Govt health spend', value: ghe ? `S$${ghe.value}B in ${ghe.year}` : 'S$16.8B in 2022' },
      { label: 'Smoking rate at historic low', value: sm ? `${sm.value}%` : '8.8%' },
    ]
  }, [healthData])

  // ── Media queries ──
  useEffect(() => {
    setPrefersReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    if (mq.matches) {
      setTransitionComplete(true)
    }
    const handler = (e) => {
      setIsMobile(e.matches)
      if (e.matches) setTransitionComplete(true)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ── Stat rotation timer ──
  useEffect(() => {
    if (prefersReduced) return
    const interval = setInterval(() => {
      setCurrentStat(prev => (prev + 1) % stats.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [prefersReduced, stats.length])

  // ── Desktop scroll height for sticky hero → snapshot transition ──
  const scrollHeight = '220vh'

  // ── anime.js scroll timeline (desktop only) ──
  useEffect(() => {
    if (prefersReduced || isMobile) return
    if (!containerRef.current || !stickyRef.current) return

    // Small delay to let layout settle after mount
    const timer = setTimeout(() => {
      if (scopeRef.current) scopeRef.current.revert()

      scopeRef.current = createScope({ root: stickyRef.current }).add(() => {
        const sticky = stickyRef.current
        const heroText = heroTextRef.current
        const chevron = sticky.querySelector('.chevron-hint')
        const snapshotHeading = sticky.querySelector('.snapshot-heading')
        const pillBar = sticky.querySelector('.pill-bar')
        const cardGrid = sticky.querySelector('.card-grid')

        // Set initial state for snapshot elements (pills stay in grid position)
        pillRefs.current.forEach(pill => {
          if (pill) utils.set(pill, { opacity: 0, translateY: 16, scale: 0.94 })
        })
        utils.set(pillBar, { opacity: 0 })
        utils.set(snapshotHeading, { opacity: 0, translateY: 20 })
        utils.set(cardGrid, { opacity: 0, translateY: 16 })

        // ── Create scroll-linked timeline ──
        const tl = createTimeline({
          defaults: { ease: 'outQuart' },
          autoplay: onScroll({
            target: containerRef.current,
            enter: 'top top',
            leave: 'bottom bottom',
            sync: true,
            onUpdate: (self) => {
              const complete = self.progress > 0.92
              if (complete !== transitionCompleteRef.current) {
                transitionCompleteRef.current = complete
                setTransitionComplete(complete)
              }
            },
          }),
        })

        // ═══ DESKTOP: Hero fade → snapshot reveal ═══

        // Phase 1: Hero text gentle scale + chevron out (0–600ms)
        if (heroText) {
          tl.add(heroText, {
            scale: [1, 0.97],
            duration: 600,
            ease: 'inOutQuad',
          }, 0)
        }
        if (chevron) {
          tl.add(chevron, {
            opacity: [1, 0],
            translateY: [0, -20],
            duration: 300,
          }, 0)
        }

        // Phase 2: Hero text + image fade out together (600–1200ms)
        if (heroText) {
          tl.add(heroText, {
            opacity: [1, 0],
            scale: [0.97, 0.92],
            duration: 450,
            ease: 'inQuart',
          }, 600)
        }
        if (heroImageRef.current) {
          tl.add(heroImageRef.current, {
            opacity: [1, 0],
            duration: 600,
            ease: 'inOutQuad',
          }, 650)
        }

        // Phase 3: Snapshot reveal (1100–1700ms)
        if (snapshotHeading) {
          tl.add(snapshotHeading, {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 400,
            ease: 'outQuart',
          }, 1100)
        }
        tl.add(pillBar, {
          opacity: [0, 1],
          duration: 300,
          ease: 'outQuad',
        }, 1250)

        // Pills simply fade up (no arc-origin flight)
        CATEGORIES.forEach((cat, i) => {
          const pill = pillRefs.current[i]
          if (!pill) return
          tl.add(pill, {
            translateY: [16, 0],
            opacity: [0, 1],
            scale: [0.94, 1],
            duration: 380,
            ease: 'outQuart',
          }, 1300 + i * 55)
        })

        if (cardGrid) {
          tl.add(cardGrid, {
            opacity: [0, 1],
            translateY: [16, 0],
            duration: 420,
          }, 1500)
        }
      })
    }, 300)

    return () => {
      clearTimeout(timer)
      if (scopeRef.current) {
        scopeRef.current.revert()
        scopeRef.current = null
      }
    }
  }, [prefersReduced, isMobile]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── CSS class toggle for settled state ──
  useEffect(() => {
    if (!stickyRef.current) return
    if (transitionComplete) {
      stickyRef.current.classList.add('settled')
    } else {
      stickyRef.current.classList.remove('settled')
    }
  }, [transitionComplete])

  // ── Notify parent when settled/unsettled ──
  useEffect(() => {
    onSettled?.(transitionComplete)
  }, [transitionComplete, onSettled])

  // ── Notify on mobile mount (no animation, settled immediately) ──
  useEffect(() => {
    if (isMobile || prefersReduced) {
      onSettled?.(true)
    }
  }, [isMobile, prefersReduced, onSettled])

  // ── Framer Motion initial fade-in ──
  const fadeIn = prefersReduced
    ? { initial: {}, animate: {}, transition: {} }
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

  // ══════════════════════════════════════════════════════════════
  // Reduced motion fallback
  // ══════════════════════════════════════════════════════════════
  if (prefersReduced) {
    return (
      <>
        <section className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
          <div className="absolute inset-0" aria-hidden="true">
            <img
              src={HERO.singapore_skyline.src}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 85% 65% at 50% 50%, rgba(10,15,30,0.80) 0%, rgba(10,15,30,0.55) 55%, rgba(10,15,30,0.30) 100%), linear-gradient(135deg, rgba(10,15,30,0.50) 0%, rgba(10,15,30,0.30) 50%, rgba(83,112,224,0.45) 100%)',
              }}
            />
          </div>
          <div className="text-center max-w-2xl mx-auto relative z-10">
            <p className="editorial-eyebrow text-white/80 mb-4">Singapore · 1960 – Today</p>
            <h1 className="font-heading text-5xl md:text-7xl tracking-tight" style={{ color: '#FFFFFF' }}>
              Middle-Out
            </h1>
            <p className="mt-4 text-lg md:text-xl font-body" style={{ color: 'rgba(255,255,255,0.92)' }}>
              Singapore's health story, told through data.
            </p>
          </div>
        </section>
        <section className="py-20 md:py-30 px-4 md:px-6" id="snapshot">
          <div className="max-w-[960px] mx-auto">
            <div className="text-center">
              <h2 className="font-heading text-3xl md:text-4xl text-primary">Singapore at a Glance</h2>
              <p className="mt-2 text-xs text-secondary/60 font-mono">
                {dataStatus === 'live' ? 'Live data from SingStat & data.gov.sg' : 'Data from MOH / SingStat'}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`pill-btn px-3 py-1.5 rounded-full text-xs font-body transition-all cursor-pointer focus:outline-none ${
                    activeCategory === cat.id ? 'text-white shadow-sm' : 'bg-card text-secondary border border-border hover:border-accent'
                  }`}
                  style={{ backgroundColor: activeCategory === cat.id ? cat.color : undefined }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredIndicators.map(({ key }) => (
                <SnapshotCard key={key} indicatorKey={key} onSelect={onSelectIndicator} healthData={healthData} />
              ))}
            </div>
          </div>
        </section>
      </>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // Mobile: Static layout, no scroll animation
  // ══════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <>
        {/* ── Full-screen Hero Landing ── */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
          <div className="absolute inset-0" aria-hidden="true">
            <img
              src={HERO.singapore_skyline.srcSmall || HERO.singapore_skyline.src}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 95% 65% at 50% 50%, rgba(10,15,30,0.82) 0%, rgba(10,15,30,0.58) 55%, rgba(10,15,30,0.35) 100%), linear-gradient(160deg, rgba(10,15,30,0.55) 0%, rgba(10,15,30,0.32) 50%, rgba(83,112,224,0.48) 100%)',
              }}
            />
          </div>

          <div className="text-center max-w-2xl mx-auto relative z-10">
            <motion.p
              className="editorial-eyebrow mb-3"
              style={{ color: 'rgba(255,255,255,0.80)' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Singapore · 1960 – Today
            </motion.p>

            <motion.h1
              className="font-heading text-5xl tracking-tight"
              style={{ color: '#FFFFFF' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Middle-Out
            </motion.h1>

            <motion.p
              className="mt-4 text-lg font-body"
              style={{ color: 'rgba(255,255,255,0.92)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              Singapore's health story, told through data.
            </motion.p>

            <motion.div
              className="mt-8 h-16 flex items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStat}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <span className="text-sm font-body" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {stats[currentStat].label}:
                  </span>
                  <span
                    className="ml-2 text-2xl font-mono font-semibold"
                    style={{ color: '#FFFFFF' }}
                  >
                    {stats[currentStat].value}
                  </span>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.div
            className="absolute bottom-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, 8, 0] }}
            transition={{ opacity: { duration: 0.6, delay: 0.7 }, y: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.7 } }}
          >
            <ChevronDown className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.6)' }} />
          </motion.div>
        </section>

        {/* ── Singapore at a Glance (revealed on scroll) ── */}
        <section className="px-4 py-16">
          <div className="max-w-[960px] mx-auto">
            <div className="text-center">
              <h2 className="font-heading text-3xl text-primary">
                Singapore at a Glance
              </h2>
              <p className="mt-2 text-xs text-secondary/60 font-mono">
                {dataStatus === 'live' ? 'Live data from SingStat & data.gov.sg' : 'Data from MOH / SingStat'}
                <InfoTooltip content="Health indicator data is fetched live from the SingStat Table Builder API." />
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`pill-btn px-3 py-1.5 rounded-full text-xs font-body transition-all cursor-pointer focus:outline-none ${
                    activeCategory === cat.id ? 'text-white shadow-sm' : 'bg-card text-secondary border border-border hover:border-accent'
                  }`}
                  style={{
                    backgroundColor: activeCategory === cat.id ? cat.color : undefined,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="mt-8">
              <div className="grid grid-cols-2 gap-4">
                {filteredIndicators.map(({ key }) => (
                  <SnapshotCard
                    key={key}
                    indicatorKey={key}
                    onSelect={onSelectIndicator}
                    healthData={healthData}
                    forceVisible={true}
                  />
                ))}
              </div>
              <p className="mt-4 text-center text-[10px] text-secondary/40">
                Tap any card to explore the full time series in detail
              </p>
            </div>
          </div>
        </section>
      </>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // Desktop: Animated Render
  // ══════════════════════════════════════════════════════════════
  return (
    <section ref={containerRef} style={{ height: scrollHeight }} className="relative">
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen flex flex-col items-center justify-center"
        style={{ overflowX: 'clip' }}
      >
        {/* ── Full-bleed editorial hero image (fades out during transition) ── */}
        <div
          ref={heroImageRef}
          className="absolute inset-0"
          style={{ zIndex: 0, willChange: 'opacity' }}
          aria-hidden="true"
        >
          <img
            src={HERO.singapore_skyline.src}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 85% 65% at 50% 50%, rgba(10,15,30,0.78) 0%, rgba(10,15,30,0.52) 55%, rgba(10,15,30,0.28) 100%), linear-gradient(135deg, rgba(10,15,30,0.48) 0%, rgba(10,15,30,0.28) 50%, rgba(83,112,224,0.45) 100%)',
            }}
          />
        </div>

        {/* ── Hero Text Content ── */}
        <div ref={heroTextRef} className="hero-text text-center max-w-2xl mx-auto relative z-10 px-6">
          <motion.p
            className="editorial-eyebrow mb-4"
            style={{ color: 'rgba(255,255,255,0.80)' }}
            {...fadeIn}
            transition={{ duration: 0.6, delay: 0 }}
          >
            Singapore · 1960 – Today
          </motion.p>

          <motion.h1
            className="font-heading text-5xl md:text-7xl tracking-tight"
            style={{ color: '#FFFFFF' }}
            {...fadeIn}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Middle-Out
          </motion.h1>

          <motion.p
            className="mt-4 text-lg md:text-xl font-body"
            style={{ color: 'rgba(255,255,255,0.92)' }}
            {...fadeIn}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            Singapore's health story, told through data.
          </motion.p>

          <motion.div
            className="mt-10 h-16 flex items-center justify-center"
            {...fadeIn}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStat}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <span className="text-sm font-body" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  {stats[currentStat].label}:
                </span>
                <span
                  className="ml-2 text-2xl md:text-3xl font-mono font-semibold"
                  style={{ color: '#FFFFFF' }}
                >
                  {stats[currentStat].value}
                </span>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── Bouncing chevron ── */}
        <div className="chevron-hint absolute bottom-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, 8, 0] }}
            transition={{ opacity: { duration: 0.6, delay: 0.6 }, y: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 } }}
          >
            <ChevronDown className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.7)' }} />
          </motion.div>
        </div>

        {/* ── Snapshot Content ── */}
        <div className="absolute inset-0 flex flex-col items-center" style={{ paddingTop: '8vh', zIndex: 15, overflow: 'visible' }}>
          <div className="snapshot-heading text-center" style={{ opacity: 0 }}>
            <h2 className="font-heading text-3xl md:text-4xl text-primary">
              Singapore at a Glance
            </h2>
            <p className="mt-2 text-xs text-secondary/60 font-mono">
              {dataStatus === 'live' ? 'Live data from SingStat & data.gov.sg' : 'Data from MOH / SingStat'}
              <InfoTooltip content="Health indicator data is fetched live from the SingStat Table Builder API." />
            </p>
          </div>

          {/* ── Pill buttons ── */}
          <div className="pill-bar mt-6 flex flex-wrap justify-center gap-2" style={{ opacity: 0 }}>
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.id}
                ref={el => pillRefs.current[i] = el}
                data-pill-id={cat.id}
                onClick={() => { if (transitionComplete) setActiveCategory(cat.id) }}
                className={`pill-btn px-3 py-1.5 rounded-full text-xs font-body transition-colors cursor-pointer focus:outline-none ${
                  activeCategory === cat.id
                    ? 'text-white shadow-sm'
                    : 'bg-card text-secondary border border-border hover:border-accent'
                }`}
                style={{
                  backgroundColor: activeCategory === cat.id ? cat.color : undefined,
                  pointerEvents: transitionComplete ? 'auto' : 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* ── Card grid ── */}
          <div className="card-grid mt-8 w-full max-w-[960px] px-4 md:px-6" style={{ opacity: 0, maxHeight: '60vh', overflowY: 'auto' }}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredIndicators.map(({ key }) => (
                <SnapshotCard
                  key={key}
                  indicatorKey={key}
                  onSelect={onSelectIndicator}
                  healthData={healthData}
                  forceVisible={transitionComplete}
                />
              ))}
            </div>
            <p className="mt-4 text-center text-[10px] text-secondary/40">
              Tap any card to explore the full time series in detail
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
