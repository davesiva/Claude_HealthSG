import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Heart, Baby, TrendingUp, DollarSign, Wallet } from 'lucide-react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import globalData from '../data/global-health-data.json'
import { INDICATORS, ENTITY_STYLES } from '../data/global-comparisons-config'
import InfoTooltip from './InfoTooltip'
import ShareButton from './share/ShareButton'

const iconMap = { Heart, Baby, TrendingUp, DollarSign, Wallet }
const axisTick = { fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#6B7280' }
const axisStroke = '#D1D5DB'

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
                  <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 11, fontFamily: 'DM Sans' }} />
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
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
