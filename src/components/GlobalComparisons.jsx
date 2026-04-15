import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Heart, Baby, TrendingUp, DollarSign, Wallet, ChevronDown, AlertTriangle, Shield, PiggyBank, Building2, Sparkles, RefreshCw } from 'lucide-react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { streamHealthSG } from '../utils/anthropic'
import { renderMarkdownParagraphs } from '../utils/renderMarkdown'
import globalData from '../data/global-health-data.json'
import { INDICATORS, ENTITY_STYLES } from '../data/global-comparisons-config'
import { POLICY_FACTS, POLICY_LAST_REVIEWED } from '../data/insurance-policy-facts'
import InfoTooltip from './InfoTooltip'
import ShareButton from './share/ShareButton'

const iconMap = { Heart, Baby, TrendingUp, DollarSign, Wallet }
const axisTick = { fontSize: 11, fontFamily: 'Roboto Mono', fill: '#6B7280' }
const axisStroke = '#D1D5DB'

const OOP_TERMS = [
  {
    icon: Shield,
    term: 'MediShield Life',
    color: '#5370E0',
    what: 'Compulsory basic health insurance for all citizens and PRs. Covers subsidised treatment in public hospital B2/C wards, day surgery, and selected outpatient treatments.',
    cost: 'Premiums are age-banded and payable from MediSave (no cash outlay for most). Deductible of $2,000/year, plus 10% co-insurance above that.',
  },
  {
    icon: Building2,
    term: 'Integrated Shield Plans (IPs)',
    color: '#5370E0',
    what: 'Optional private insurance that sits on top of MediShield Life. Provides coverage for higher ward classes (B1, A) or private hospitals.',
    cost: 'Premiums vary widely by age and insurer. Riders that previously covered deductibles and co-pay now require a minimum 5% co-payment (capped at $3,000/year, rising to $6,000 from April 2026).',
  },
  {
    icon: PiggyBank,
    term: 'MediSave',
    color: '#F59E0B',
    what: 'Compulsory individual medical savings account (part of CPF). Can be used for hospitalisation, insurance premiums, chronic disease management, and vaccinations.',
    cost: '8\u201310.5% of salary contributed automatically. Withdrawal limits apply \u2014 e.g. $800/year for IP premiums, $400/year for outpatient (from Oct 2025).',
  },
]

// Build grounding context from verified policy facts
function buildPolicyContext() {
  return POLICY_FACTS.map(p =>
    `[${p.topic}] (updated ${p.updated}, source: ${p.source})\n${p.facts.map(f => `• ${f}`).join('\n')}`
  ).join('\n\n')
}

const OOP_UPDATE_PROMPT = `You are a health policy analyst providing a concise update on Singapore's healthcare insurance landscape as it relates to out-of-pocket spending.

IMPORTANT: You MUST base your response on the verified policy facts provided below. Do NOT rely on your training data for specific dates, dollar amounts, or policy details — use ONLY the facts given. If the facts below do not cover a topic, omit it rather than guessing.

Cover the following in 2–3 short paragraphs (no headings, no bullet points):
1. The latest changes to MediShield Life (premium adjustments, claim limit changes, government support measures)
2. Integrated Shield Plan (IP) rider policy changes — especially co-payment requirements, deductible coverage rules, and any recent MOH announcements
3. Any recent or upcoming MediSave changes (withdrawal limits, Flexi-MediSave, etc.)

Rules:
- Use ONLY the verified facts provided — do not add figures or dates from your training data
- Use plain language a general audience can understand
- Do NOT include disclaimers like "consult a financial advisor" — this is an informational summary
- Do NOT use headings, bullet points, or numbered lists — write in flowing paragraphs
- Keep the total response under 200 words
- Bold key terms using **markdown** for emphasis`

function OOPContextPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [aiUpdate, setAiUpdate] = useState('')
  const [aiStatus, setAiStatus] = useState('idle') // idle | loading | done | error
  const aiCacheRef = useRef(null)

  const generateUpdate = useCallback(async () => {
    if (aiCacheRef.current) {
      setAiUpdate(aiCacheRef.current)
      setAiStatus('done')
      return
    }
    setAiStatus('loading')
    setAiUpdate('')
    try {
      const factsContext = buildPolicyContext()
      const result = await streamHealthSG(
        [{ role: 'user', content: `Here are the latest verified policy facts (last reviewed ${POLICY_LAST_REVIEWED}):\n\n${factsContext}\n\nBased on these facts, provide a brief update on the current state of Singapore's health insurance landscape — MediShield Life, Integrated Shield Plans, IP riders, and MediSave. Focus on recent policy changes and what they mean for out-of-pocket costs.` }],
        OOP_UPDATE_PROMPT,
        512,
        (text) => setAiUpdate(text)
      )
      aiCacheRef.current = result
      setAiStatus('done')
    } catch {
      setAiStatus('error')
    }
  }, [])

  const handleToggle = () => {
    const opening = !isOpen
    setIsOpen(opening)
    if (opening && aiStatus === 'idle') {
      generateUpdate()
    }
  }

  const handleRefresh = (e) => {
    e.stopPropagation()
    aiCacheRef.current = null
    generateUpdate()
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-4 py-3 text-left cursor-pointer focus:outline-none"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
        <span className="text-xs font-body font-semibold text-amber-800 flex-1">
          Important context: what this metric does and doesn't capture
        </span>
        <ChevronDown
          size={14}
          className={`text-amber-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* What OOP measures */}
              <div>
                <p className="text-xs font-body font-semibold text-primary mb-1">What "out-of-pocket" measures</p>
                <p className="text-xs font-body text-secondary leading-relaxed">
                  The WHO defines out-of-pocket (OOP) spending as <strong>direct payments at the point of care</strong> — co-payments, deductibles, and fees for uncovered services. It <strong>excludes</strong> insurance premiums, MediSave contributions, and taxes. Singapore's drop from ~49% to ~25% partly reflects the expansion of MediShield Life and government subsidies, but also accounting choices about how MediSave is classified internationally.
                </p>
              </div>

              {/* What people actually pay */}
              <div>
                <p className="text-xs font-body font-semibold text-primary mb-1">What Singaporeans actually pay</p>
                <p className="text-xs font-body text-secondary leading-relaxed">
                  The true household healthcare burden is higher than this metric suggests. Mandatory MediSave contributions (8–10.5% of salary), MediShield Life premiums, and optional IP/rider premiums are all excluded from the OOP figure — yet they represent real costs. The IP rider controversy, where "as-charged" riders led to over-consumption and spiralling premiums, highlights how insurance design directly affects what people pay.
                </p>
              </div>

              {/* Key terms */}
              <div>
                <p className="text-xs font-body font-semibold text-primary mb-2">Singapore's healthcare financing: key terms</p>
                <div className="space-y-3">
                  {OOP_TERMS.map(t => (
                    <div key={t.term} className="flex gap-2.5">
                      <div className="shrink-0 mt-0.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: t.color + '18' }}>
                          <t.icon size={13} style={{ color: t.color }} />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-body font-semibold text-primary">{t.term}</p>
                        <p className="text-[11px] font-body text-secondary leading-relaxed mt-0.5">{t.what}</p>
                        <p className="text-[11px] font-body text-secondary/70 leading-relaxed mt-0.5"><strong className="text-secondary">Cost:</strong> {t.cost}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] font-mono text-secondary/40">
                Sources: MOH Singapore, CPF Board, WHO Global Health Expenditure Database (SHA 2011 framework) · Last reviewed {POLICY_LAST_REVIEWED}
              </p>

              {/* AI-generated recent developments */}
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={12} className="text-indigo-500" />
                  <p className="text-xs font-body font-semibold text-primary flex-1">Recent developments</p>
                  {aiStatus === 'done' && (
                    <button
                      onClick={handleRefresh}
                      className="p-1 rounded-full hover:bg-indigo-100 transition-colors cursor-pointer"
                      title="Refresh update"
                    >
                      <RefreshCw size={11} className="text-indigo-400" />
                    </button>
                  )}
                </div>

                {aiStatus === 'loading' && !aiUpdate && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-3 h-3 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
                    <p className="text-[11px] font-body text-secondary">Fetching latest policy updates...</p>
                  </div>
                )}

                {aiUpdate && (
                  <div className="text-[11px] font-body text-secondary leading-relaxed space-y-1.5">
                    {renderMarkdownParagraphs(aiUpdate)}
                  </div>
                )}

                {aiStatus === 'error' && (
                  <p className="text-[11px] font-body text-red-500">
                    Unable to fetch updates. <button onClick={handleRefresh} className="underline cursor-pointer">Try again</button>
                  </p>
                )}

                <p className="text-[10px] font-mono text-indigo-300 mt-2 flex items-center gap-1">
                  <Sparkles size={9} />
                  AI-generated summary — verify important details with official sources (MOH, CPF Board)
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ComparisonTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white px-3 py-2 text-xs border border-border rounded-lg shadow-md">
      <p className="font-mono font-semibold text-primary mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-mono" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number'
            ? p.value < 10 ? p.value.toFixed(2) : p.value.toFixed(1)
            : p.value}
        </p>
      ))}
    </div>
  )
}

export default function GlobalComparisons() {
  const [activeId, setActiveId] = useState(INDICATORS[0].id)
  const [visibleEntities, setVisibleEntities] = useState(['singapore', 'world', 'regional', 'malaysia'])
  const [ref, isVisible] = useScrollAnimation(0.1)
  const [isMobile, setIsMobile] = useState(false)
  const chartContainerRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const activeIndicator = INDICATORS.find(i => i.id === activeId)
  const indicatorData = globalData[activeIndicator.dataKey]

  // Build merged chart data from all visible entities
  const allYears = new Set()
  for (const key of Object.keys(indicatorData)) {
    if (visibleEntities.includes(key)) {
      indicatorData[key].forEach(d => allYears.add(d.year))
    }
  }
  const chartData = [...allYears].sort((a, b) => a - b).map(year => {
    const row = { year }
    for (const key of Object.keys(indicatorData)) {
      if (visibleEntities.includes(key)) {
        const point = indicatorData[key].find(d => d.year === year)
        if (point) row[key] = point.value
      }
    }
    return row
  })

  // Available entities for this indicator
  const availableEntities = Object.keys(indicatorData)

  const toggleEntity = (entity) => {
    if (entity === 'singapore') return // always show Singapore
    setVisibleEntities(prev =>
      prev.includes(entity)
        ? prev.filter(e => e !== entity)
        : [...prev, entity]
    )
  }

  return (
    <section className="py-20 md:py-30 px-4 md:px-6" id="global">
      <div className="max-w-[960px] mx-auto">
        <motion.h2
          ref={ref}
          className="font-heading text-3xl md:text-4xl text-primary text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          Singapore in the World
          <InfoTooltip content="Compare Singapore's health indicators against global and regional benchmarks using standardised data from Our World in Data (WHO, UN, World Bank). All measurements use identical international definitions for apples-to-apples comparison." />
        </motion.h2>

        <p className="text-center text-secondary text-sm mt-3 max-w-lg mx-auto">
          How does Singapore stack up against the world, the region, and its nearest neighbour?
        </p>

        {/* Indicator cards */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
          {INDICATORS.map(indicator => {
            const Icon = iconMap[indicator.icon]
            const isActive = indicator.id === activeId
            return (
              <motion.button
                key={indicator.id}
                onClick={() => setActiveId(indicator.id)}
                className={`p-3 md:p-4 rounded-2xl text-center cursor-pointer transition-all border-2 focus:outline-none ${
                  isActive
                    ? 'bg-white border-accent shadow-md'
                    : 'bg-white border-border hover:border-accent/40'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon
                  size={isMobile ? 18 : 22}
                  className="mx-auto mb-1.5"
                  style={{ color: isActive ? indicator.color : '#9CA3AF' }}
                />
                <h3 className="font-heading text-xs md:text-sm text-primary leading-tight">{indicator.title}</h3>
              </motion.button>
            )
          })}
        </div>

        {/* Entity toggle pills */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {availableEntities.map(key => {
            const style = ENTITY_STYLES[key]
            const isActive = visibleEntities.includes(key)
            const isSingapore = key === 'singapore'
            return (
              <button
                key={key}
                onClick={() => toggleEntity(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-body transition-all focus:outline-none ${
                  isSingapore
                    ? 'bg-accent text-white cursor-default'
                    : isActive
                      ? 'text-white cursor-pointer'
                      : 'bg-card text-secondary border border-border cursor-pointer hover:border-accent'
                }`}
                style={{
                  backgroundColor: isSingapore ? undefined : isActive ? style.color : undefined,
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {style.label}
              </button>
            )
          })}
        </div>

        {/* Chart area */}
        <AnimatePresence mode="wait">
          <motion.div
            ref={chartContainerRef}
            key={activeId}
            className="mt-6 card p-3 md:p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-sm font-body font-semibold text-primary">
                  {activeIndicator.title}
                  <span className="ml-1 text-secondary font-normal">({activeIndicator.unit})</span>
                </h3>
                <p className="text-xs text-secondary/70 mt-1 italic max-w-md">
                  {activeIndicator.narrative}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <ShareButton title={activeIndicator.title} subtitle={`Singapore vs. the World`} chartRef={chartContainerRef} />
                <span className="text-[10px] font-mono text-secondary/50">
                  {activeIndicator.yearRange[0]}-{activeIndicator.yearRange[1]}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: isMobile ? -15 : 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis
                    dataKey="year"
                    tick={{ ...axisTick, fontSize: isMobile ? 10 : 11 }}
                    stroke={axisStroke}
                  />
                  <YAxis
                    tick={{ ...axisTick, fontSize: isMobile ? 10 : 11 }}
                    stroke={axisStroke}
                    width={isMobile ? 35 : 55}
                    domain={activeIndicator.domain || ['auto', 'auto']}
                  />
                  <Tooltip content={<ComparisonTooltip />} />
                  <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 11, fontFamily: 'Lato' }} />
                  {availableEntities.filter(k => visibleEntities.includes(k)).map(key => {
                    const style = ENTITY_STYLES[key]
                    return (
                      <Line
                        key={key}
                        dataKey={key}
                        name={style.label}
                        stroke={style.color}
                        strokeWidth={style.strokeWidth}
                        strokeDasharray={style.strokeDasharray}
                        dot={key === 'singapore' && !isMobile ? { r: 3, fill: style.color } : false}
                        activeDot={key === 'singapore'
                          ? { r: 5, fill: style.color, stroke: '#fff', strokeWidth: 2 }
                          : { r: 4, fill: style.color }
                        }
                        connectNulls
                        isAnimationActive={true}
                        animationDuration={1000}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-3 text-[10px] text-secondary/40 font-mono">
              Source: Our World in Data — {activeIndicator.source}
            </p>

            {activeId === 'out_of_pocket' && <OOPContextPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
