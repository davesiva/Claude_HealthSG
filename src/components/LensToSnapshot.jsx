import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createTimeline, onScroll, stagger } from 'animejs'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useCountUp } from '../hooks/useCountUp'
import { useHealthData } from '../context/HealthDataContext'
import { CATEGORIES, RINGS, indicators, positiveUpKeys } from './snapshotData'
import InfoTooltip from './InfoTooltip'

// ── Annotation positions (desktop: leader lines to the right) ──
const ANNOTATIONS = [
  { ringIdx: 4, lx: 560, ly: 140 },
  { ringIdx: 3, lx: 560, ly: 210 },
  { ringIdx: 2, lx: 560, ly: 280 },
  { ringIdx: 1, lx: 560, ly: 350 },
  { ringIdx: 0, lx: 560, ly: 420 },
]

const TICK_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]
const LINE_LENGTH = 100

// ── Snapshot Card (reused from Snapshot.jsx) ──
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

function SnapshotCard({ indicatorKey, onSelect, healthData }) {
  const [ref, isVisible] = useScrollAnimation(0.2)
  const indicator = healthData[indicatorKey]
  if (!indicator) return null

  const data = indicator.data
  const latest = data[data.length - 1]
  const previous = data[data.length - 2]
  const change = previous
    ? ((latest.value - previous.value) / previous.value * 100).toFixed(1)
    : null
  const isUp = change > 0
  const countValue = useCountUp(latest.value, 1500, isVisible)
  const displayValue = countValue.toFixed(1)
  const isPositiveUp = positiveUpKeys.has(indicatorKey)
  const trendColor = isPositiveUp
    ? (isUp ? '#5370E0' : '#EF4444')
    : (isUp ? '#EF4444' : '#5370E0')
  const tooltipContent = indicator.tooltip || indicator.description || ''

  return (
    <motion.div
      ref={ref}
      className="snapshot-card card p-3 md:p-5 cursor-pointer hover:card-hover focus:outline-none"
      style={{ WebkitTapHighlightColor: 'transparent', opacity: 0, transform: 'translateY(24px)' }}
      initial={false}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      onClick={() => onSelect(indicatorKey)}
    >
      <div className="flex items-start gap-1">
        <p className="text-sm text-secondary font-body truncate flex-1">{indicator.label}</p>
        {tooltipContent && <InfoTooltip content={tooltipContent} size={13} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-mono font-semibold text-primary">
          {isVisible ? displayValue : '0'}
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
            <Line type="monotone" dataKey="value" stroke="#5370E0" strokeWidth={1.5} dot={false} isAnimationActive={isVisible} animationDuration={1500} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[10px] text-secondary/40 font-mono">
        {data[0].year}–{latest.year}
      </p>
    </motion.div>
  )
}

// ── Main Component ──
export default function LensToSnapshot({ onSelectIndicator }) {
  const containerRef = useRef(null)
  const stickyRef = useRef(null)
  const svgRef = useRef(null)
  const pillBarRef = useRef(null)
  const ringRefs = useRef([])
  const morphDivRefs = useRef([])
  const timelineRef = useRef(null)



  const [isMobile, setIsMobile] = useState(false)
  const [prefersReduced, setPrefersReduced] = useState(false)
  const [transitionComplete, setTransitionComplete] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')

  const { healthData, dataStatus } = useHealthData()

  const filteredIndicators = activeCategory === 'all'
    ? indicators
    : indicators.filter(i => i.category === activeCategory)

  // ── Media queries ──
  useEffect(() => {
    setPrefersReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ── Measure pill positions for morph targets ──
  const measurePills = useCallback(() => {
    if (!pillBarRef.current || !stickyRef.current) return null
    const stickyRect = stickyRef.current.getBoundingClientRect()
    const pills = pillBarRef.current.querySelectorAll('[data-pill-id]')
    const targets = {}
    pills.forEach(pill => {
      const id = pill.dataset.pillId
      const r = pill.getBoundingClientRect()
      targets[id] = {
        x: r.left - stickyRect.left + r.width / 2,
        y: r.top - stickyRect.top + r.height / 2,
        width: r.width,
        height: r.height,
      }
    })
    return targets
  }, [])

  // ── Helper: query inside sticky container ──
  const $ = useCallback((sel) => {
    if (!stickyRef.current) return null
    const els = stickyRef.current.querySelectorAll(sel)
    return els.length === 1 ? els[0] : Array.from(els)
  }, [])

  // ── anime.js scroll timeline ──
  useEffect(() => {
    if (prefersReduced) return
    if (!containerRef.current || !stickyRef.current) return

    const timer = setTimeout(() => {
      buildTimeline()
    }, 300)

    return () => {
      clearTimeout(timer)
      if (timelineRef.current) {
        timelineRef.current.revert()
        timelineRef.current = null
      }
    }
  }, [prefersReduced, isMobile])

  function buildTimeline() {
    // Clean previous
    if (timelineRef.current) {
      timelineRef.current.revert()
      timelineRef.current = null
    }

    const mob = isMobile
    const tiltX = mob ? -10 : -20
    const tiltY = mob ? 6 : 12

    console.log('[LensToSnapshot] buildTimeline called, isMobile:', mob)
    console.log('[LensToSnapshot] containerRef:', !!containerRef.current, 'stickyRef:', !!stickyRef.current)

    // Measure pill positions before building timeline
    const pillTargets = measurePills()
    console.log('[LensToSnapshot] pillTargets:', pillTargets)

    // Pre-position morph divs at SVG center
    if (pillTargets && stickyRef.current && svgRef.current) {
      const stickyRect = stickyRef.current.getBoundingClientRect()
      const svgRect = svgRef.current.getBoundingClientRect()
      const svgCenterX = svgRect.left - stickyRect.left + svgRect.width / 2
      const svgCenterY = svgRect.top - stickyRect.top + svgRect.height / 2

      RINGS.forEach((ring, i) => {
        const el = morphDivRefs.current[i]
        if (!el) return
        const ringSize = ring.r * 2
        el.style.left = `${svgCenterX - ringSize / 2}px`
        el.style.top = `${svgCenterY - ringSize / 2}px`
        el.style.width = `${ringSize}px`
        el.style.height = `${ringSize}px`
      })
    }

    // Direct approach: create timeline with onScroll, no scope wrapper
    const lensWrapper = stickyRef.current.querySelector('.lens-wrapper')
    const lensSvg = stickyRef.current.querySelector('.lens-svg')
    console.log('[LensToSnapshot] lensWrapper:', !!lensWrapper, 'lensSvg:', !!lensSvg)

    const tl = createTimeline({
      defaults: { ease: 'outExpo' },
      autoplay: onScroll({
        target: containerRef.current,
        enter: 'top top',
        leave: 'bottom bottom',
        sync: true,
        debug: true,
        onUpdate: (self) => {
          if (Math.random() < 0.02) console.log('[scroll]', 'progress:', self.progress, 'linked:', !!self.linked, 'scroll:', self.scroll)
        },
      }),
    })
    console.log('[LensToSnapshot] timeline created:', tl)

    // Use direct DOM refs instead of CSS selectors to avoid scoping issues
    // ── Phase 1: Assemble (0 - 600ms → maps to 0-0.15 scroll) ──
    tl.add(lensWrapper, {
      rotateX: [0, tiltX],
      rotateY: [0, tiltY],
      duration: 600,
    }, 0)
    tl.add(lensSvg, {
      opacity: [0.3, 1],
      duration: 400,
    }, 0)

    // ── Phase 2: Explode (600 - 1400ms → 0.15-0.35) ──
    RINGS.forEach((ring, i) => {
      const maxOffset = -i * (mob ? 20 : 35)
      const ringG = stickyRef.current.querySelector(`#ring-g-${ring.id}`)
      if (ringG) {
        tl.add(ringG, {
          translateY: [0, maxOffset],
          duration: 800,
          ease: 'outQuart',
        }, 600)
      }
    })
    const ringCircles = stickyRef.current.querySelectorAll('.ring-circle')
    if (ringCircles.length) {
      tl.add(ringCircles, {
        strokeOpacity: [0.5, 0.9],
        duration: 600,
      }, 800)
    }

    // ── Phase 3: Annotate (1400 - 2200ms → 0.35-0.55) ──
    if (!mob) {
      const annoLines = stickyRef.current.querySelectorAll('.annotation-line')
      const annoLabels = stickyRef.current.querySelectorAll('.annotation-label')
      if (annoLines.length) {
        tl.add(annoLines, {
          strokeDashoffset: [LINE_LENGTH, 0],
          duration: 400,
          delay: stagger(80),
          ease: 'inOutQuad',
        }, 1400)
      }
      if (annoLabels.length) {
        tl.add(annoLabels, {
          opacity: [0, 1],
          duration: 300,
          delay: stagger(80),
        }, 1600)
      }
    }

    // ── Phase 4: Gather (2200 - 2800ms → 0.55-0.70) ──
    RINGS.forEach((ring) => {
      const ringG = stickyRef.current.querySelector(`#ring-g-${ring.id}`)
      if (ringG) {
        tl.add(ringG, {
          translateY: 0,
          duration: 600,
          ease: 'inOutQuart',
        }, 2200)
      }
    })
    tl.add(lensWrapper, {
      rotateX: 0,
      rotateY: 0,
      duration: 600,
      ease: 'inOutQuart',
    }, 2200)
    if (!mob) {
      const annoLines = stickyRef.current.querySelectorAll('.annotation-line')
      const annoLabels = stickyRef.current.querySelectorAll('.annotation-label')
      if (annoLines.length) {
        tl.add(annoLines, {
          opacity: [1, 0],
          duration: 400,
        }, 2400)
      }
      if (annoLabels.length) {
        tl.add(annoLabels, {
          opacity: 0,
          duration: 400,
        }, 2400)
      }
    }

    // ── Phase 5: Morph (2800 - 3520ms → 0.70-0.88) ──
    tl.add(lensSvg, {
      opacity: [1, 0],
      scale: [1, 0.6],
      duration: 300,
      ease: 'inQuart',
    }, 2800)

    const morphDivs = stickyRef.current.querySelectorAll('.morph-div')
    if (pillTargets && morphDivs.length) {
      tl.add(morphDivs, {
        opacity: [0, 1],
        duration: 200,
      }, 2800)

      RINGS.forEach((ring, i) => {
        const target = pillTargets[ring.id]
        if (!target) return
        const morphEl = stickyRef.current.querySelector(`#morph-${ring.id}`)
        const morphLabel = morphEl?.querySelector('.morph-label')
        if (!morphEl) return
        const ringSize = ring.r * 2

        tl.add(morphEl, {
          left: target.x - target.width / 2,
          top: target.y - target.height / 2,
          width: target.width,
          height: target.height,
          borderWidth: [ring.strokeWidth, 0],
          borderRadius: [ringSize / 2, 16],
          duration: 500,
          ease: 'inOutQuart',
          delay: i * 60,
        }, 2900)

        tl.add(morphEl, {
          backgroundColor: ['rgba(0,0,0,0)', ring.color],
          duration: 400,
          ease: 'inOutQuad',
        }, 3000 + i * 60)

        if (morphLabel) {
          tl.add(morphLabel, {
            color: [ring.color, '#ffffff'],
            fontSize: [mob ? 10 : 12, 12],
            duration: 400,
          }, 3000 + i * 60)
        }
      })
    }

    // ── Phase 6: Settle (3520 - 4000ms → 0.88-1.00) ──
    if (morphDivs.length) {
      tl.add(morphDivs, {
        opacity: [1, 0],
        duration: 200,
      }, 3520)
    }
    const snapshotHeading = stickyRef.current.querySelector('.snapshot-heading')
    const pillBar = stickyRef.current.querySelector('.pill-bar')
    const cardGrid = stickyRef.current.querySelector('.card-grid')
    if (snapshotHeading) {
      tl.add(snapshotHeading, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 400,
        ease: 'outQuart',
      }, 3400)
    }
    if (pillBar) {
      tl.add(pillBar, {
        opacity: [0, 1],
        duration: 300,
      }, 3520)
    }
    if (cardGrid) {
      tl.add(cardGrid, {
        opacity: [0, 1],
        duration: 400,
      }, 3600)
    }

    timelineRef.current = tl
    console.log('[LensToSnapshot] timeline duration:', tl.duration)
  }

  // ── Reduced motion: static fallback ──
  if (prefersReduced) {
    return (
      <section className="py-20 md:py-30 px-4 md:px-6" id="snapshot">
        <div className="max-w-[960px] mx-auto">
          <div className="text-center">
            <h2 className="font-heading text-3xl md:text-4xl text-primary">Singapore at a Glance</h2>
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
                className={`px-3 py-1.5 rounded-full text-xs font-body transition-all cursor-pointer focus:outline-none ${
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
    )
  }

  const scrollHeight = isMobile ? '300vh' : '400vh'
  const viewBox = isMobile ? '50 50 500 500' : '0 0 700 600'

  return (
    <section ref={containerRef} style={{ height: scrollHeight }} className="relative">
      {/* Sticky viewport — everything stays visible during scroll */}
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ perspective: '1000px' }}
      >
        {/* ── SVG Lens (Phases 1-4) ── */}
        <div className="lens-wrapper" style={{ transformStyle: 'preserve-3d' }}>
          <svg
            ref={svgRef}
            viewBox={viewBox}
            fill="none"
            className={`lens-svg ${isMobile ? 'w-[300px] h-[300px]' : 'w-[580px]'}`}
            style={{ maxHeight: '60vh' }}
          >
            {/* Crosshair lines */}
            <line x1={300} y1={40} x2={300} y2={140} stroke="#5370E0" strokeWidth={1} strokeOpacity={0.2} />
            <line x1={300} y1={460} x2={300} y2={560} stroke="#5370E0" strokeWidth={1} strokeOpacity={0.2} />
            <line x1={40} y1={300} x2={140} y2={300} stroke="#5370E0" strokeWidth={1} strokeOpacity={0.2} />
            <line x1={460} y1={300} x2={560} y2={300} stroke="#5370E0" strokeWidth={1} strokeOpacity={0.2} />

            {/* Center focal point */}
            <circle cx={300} cy={300} r={6} fill="#5370E0" fillOpacity={0.3} />
            <circle cx={300} cy={300} r={2} fill="#5370E0" fillOpacity={0.6} />

            {/* Tick marks */}
            {TICK_ANGLES.map(angle => {
              const rad = (angle * Math.PI) / 180
              const outerR = RINGS[4].r
              return (
                <line
                  key={angle}
                  x1={300 + (outerR - 4) * Math.cos(rad)}
                  y1={300 + (outerR - 4) * Math.sin(rad)}
                  x2={300 + (outerR + 1) * Math.cos(rad)}
                  y2={300 + (outerR + 1) * Math.sin(rad)}
                  stroke="#8B5CF6"
                  strokeWidth={1.5}
                  strokeOpacity={0.3}
                />
              )
            })}

            {/* Concentric rings with annotations */}
            {RINGS.map((ring, i) => {
              const annot = ANNOTATIONS.find(a => a.ringIdx === i)
              return (
                <g key={ring.id} id={`ring-g-${ring.id}`} ref={el => ringRefs.current[i] = el}>
                  <circle
                    className="ring-circle"
                    cx={300} cy={300} r={ring.r}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={ring.strokeWidth}
                    strokeOpacity={0.5}
                  />
                  {annot && !isMobile && (
                    <>
                      <line
                        className="annotation-line"
                        x1={300 + ring.r} y1={300}
                        x2={annot.lx} y2={annot.ly}
                        stroke={ring.color}
                        strokeWidth={1}
                        strokeDasharray={LINE_LENGTH}
                        strokeDashoffset={LINE_LENGTH}
                        strokeOpacity={0.7}
                      />
                      <text
                        className="annotation-label"
                        x={annot.lx + 8} y={annot.ly + 4}
                        fill={ring.color}
                        fontSize={12}
                        fontFamily="Roboto Mono, monospace"
                        opacity={0}
                      >
                        {ring.label}
                      </text>
                    </>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* ── Morph transition divs (Phase 5) ── */}
        {RINGS.map((ring, i) => (
          <div
            key={ring.id}
            id={`morph-${ring.id}`}
            ref={el => morphDivRefs.current[i] = el}
            className="morph-div absolute pointer-events-none"
            style={{
              opacity: 0,
              border: `${ring.strokeWidth}px solid ${ring.color}`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              willChange: 'transform, width, height, left, top',
            }}
          >
            <span
              className="morph-label whitespace-nowrap font-mono"
              style={{
                color: ring.color,
                fontSize: isMobile ? 10 : 12,
              }}
            >
              {ring.label}
            </span>
          </div>
        ))}

        {/* ── Snapshot Content (Phases 5-6) ── */}
        <div className="absolute inset-0 flex flex-col items-center" style={{ paddingTop: '8vh' }}>
          {/* Heading */}
          <div className="snapshot-heading text-center" style={{ opacity: 0 }}>
            <h2 className="font-heading text-3xl md:text-4xl text-primary">
              Singapore at a Glance
            </h2>
            <p className="mt-2 text-xs text-secondary/60 font-mono">
              {dataStatus === 'live' ? 'Live data from SingStat & data.gov.sg' : 'Data from MOH / SingStat'}
              <InfoTooltip content="Health indicator data is fetched live from the SingStat Table Builder API." />
            </p>
          </div>

          {/* Pill bar — hidden initially, used for position measurement + final interactive state */}
          <div
            ref={pillBarRef}
            className="pill-bar mt-6 flex flex-wrap justify-center gap-2"
            style={{ opacity: 0 }}
          >
            {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
              <button
                key={cat.id}
                data-pill-id={cat.id}
                onClick={() => { if (transitionComplete) setActiveCategory(cat.id) }}
                className={`px-3 py-1.5 rounded-full text-xs font-body transition-all cursor-pointer focus:outline-none ${
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
            {/* "All" pill */}
            <button
              data-pill-id="all"
              onClick={() => { if (transitionComplete) setActiveCategory('all') }}
              className={`px-3 py-1.5 rounded-full text-xs font-body transition-all cursor-pointer focus:outline-none ${
                activeCategory === 'all'
                  ? 'text-white shadow-sm'
                  : 'bg-card text-secondary border border-border hover:border-accent'
              }`}
              style={{
                backgroundColor: activeCategory === 'all' ? '#6B7280' : undefined,
                pointerEvents: transitionComplete ? 'auto' : 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              All
            </button>
          </div>

          {/* Card grid */}
          <div className="card-grid mt-8 w-full max-w-[960px] px-4 md:px-6 overflow-y-auto" style={{ opacity: 0, maxHeight: '60vh' }}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredIndicators.map(({ key }) => (
                <SnapshotCard
                  key={key}
                  indicatorKey={key}
                  onSelect={onSelectIndicator}
                  healthData={healthData}
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
