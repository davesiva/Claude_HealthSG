import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { DollarSign, Users, GraduationCap, Ribbon, Sparkles, Loader2, FileText } from 'lucide-react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useHealthData } from '../context/HealthDataContext'
import { buildChartData } from '../utils/insightLabDataResolver'
import { resolveSeriesData } from '../utils/insightLabDataResolver'
import { computeDataBriefStats, Sparkline } from '../utils/dataBriefStats'
import { askHealthSG } from '../utils/anthropic'
import { THEMES } from '../data/insight-lab-config'
import InfoTooltip from './InfoTooltip'
import ShareButton from './share/ShareButton'
import CancerButterflyChart from './insight-charts/CancerButterflyChart'
import CancerAgeChart from './insight-charts/CancerAgeChart'

const iconMap = { DollarSign, Users, GraduationCap, Ribbon }

const axisTick = { fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#6B7280' }
const axisStroke = '#D1D5DB'

function DualAxisTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white px-3 py-2 text-xs border border-border rounded-lg shadow-md max-w-[220px]">
      <p className="font-mono font-semibold text-primary mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-mono" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number'
            ? p.value < 1 ? p.value.toFixed(3) : p.value.toLocaleString()
            : p.value}
        </p>
      ))}
    </div>
  )
}

export default function InsightLab() {
  const { healthData, dataStatus } = useHealthData()
  const [activeThemeId, setActiveThemeId] = useState(THEMES[0].id)
  const [activeComparisonId, setActiveComparisonId] = useState(THEMES[0].comparisons[0].id)
  const [narratives, setNarratives] = useState({})
  const [narrativeLoading, setNarrativeLoading] = useState(false)
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

  const activeTheme = THEMES.find(t => t.id === activeThemeId)
  const activeComparison = activeTheme?.comparisons.find(c => c.id === activeComparisonId)

  const handleThemeChange = useCallback((themeId) => {
    setActiveThemeId(themeId)
    const theme = THEMES.find(t => t.id === themeId)
    if (theme?.comparisons.length) {
      setActiveComparisonId(theme.comparisons[0].id)
    }
  }, [])

  // Compute stats for the Data Brief
  const briefStats = useMemo(() => {
    if (!activeComparison || !healthData) return null
    return computeDataBriefStats(healthData, activeComparison)
  }, [activeComparison, healthData])

  // Count total data points for provenance display
  const dataPointCount = useMemo(() => {
    if (!activeComparison || !healthData || !activeComparison.dataBrief?.dataPointCount) return 0
    if (!activeComparison.series) return 0
    let count = 0
    for (const s of activeComparison.series) {
      const data = resolveSeriesData(healthData, s.dataPath, activeComparison.yearRange || [1900, 2100])
      count += data.length
    }
    return count
  }, [activeComparison, healthData])

  const generateNarrative = useCallback(async () => {
    if (!activeComparison || narratives[activeComparison.id]) return
    setNarrativeLoading(true)
    try {
      const statsContext = briefStats
        ? `\nPre-computed stats: ${briefStats.map(s => `${s.label}: ${s.value}`).join(', ')}.`
        : ''
      const systemPrompt = `You are a health data analyst writing a Data Brief for Singapore's health dashboard. Given the chart data and pre-computed statistics, write exactly ONE sentence that answers "why should a policymaker care?" Do not describe the trend (the reader can see the chart). Instead, connect the dots — what does this imply for policy, funding, or public health strategy? Reference a related health indicator from another part of the dashboard if relevant. No markdown. No preamble. Just the single insight sentence.`
      const result = await askHealthSG(
        [{ role: 'user', content: activeComparison.narrativePrompt + statsContext }],
        systemPrompt,
        150
      )
      setNarratives(prev => ({ ...prev, [activeComparison.id]: result }))
    } catch {
      setNarratives(prev => ({ ...prev, [activeComparison.id]: '__error__' }))
    } finally {
      setNarrativeLoading(false)
    }
  }, [activeComparison, narratives, briefStats])

  if (!healthData || dataStatus === 'loading') {
    return (
      <section className="py-20 md:py-30 px-4 md:px-6">
        <div className="max-w-[960px] mx-auto">
          <div className="h-8 w-48 bg-grid rounded animate-pulse mx-auto mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-grid rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="mt-8 h-[350px] bg-grid rounded-2xl animate-pulse" />
        </div>
      </section>
    )
  }

  const isCustomChart = activeComparison?.chartType != null
  const chartData = (activeComparison && !isCustomChart) ? buildChartData(healthData, activeComparison) : []
  const customChartData = isCustomChart && activeComparison.dataPath ? healthData[activeComparison.dataPath] : null
  const hasData = isCustomChart ? customChartData != null : chartData.length > 0

  return (
    <section className="py-20 md:py-30 px-4 md:px-6" id="insight-lab">
      <div className="max-w-[960px] mx-auto">
        {/* Section heading */}
        <motion.h2
          ref={ref}
          className="font-heading text-3xl md:text-4xl text-primary text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          Insight Lab
          <InfoTooltip content="Cross-reference health data with income, demographics, and education data from SingStat to uncover patterns. Select a theme, then pick a comparison to explore. All data is fetched live from official government sources." />
        </motion.h2>

        <p className="text-center text-secondary text-sm mt-3 max-w-lg mx-auto">
          Explore connections between health outcomes and socioeconomic factors using real Singapore government data.
        </p>

        {/* Theme selector */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {THEMES.map(theme => {
            const Icon = iconMap[theme.icon]
            const isActive = theme.id === activeThemeId
            return (
              <motion.button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`p-4 md:p-5 rounded-2xl text-center cursor-pointer transition-all border-2 focus:outline-none ${
                  isActive
                    ? 'bg-white border-accent shadow-md'
                    : 'bg-white border-border hover:border-accent/40'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon
                  size={24}
                  className="mx-auto mb-2"
                  style={{ color: isActive ? theme.color : '#9CA3AF' }}
                />
                <h3 className="font-heading text-base md:text-lg text-primary">{theme.title}</h3>
                <p className="text-xs text-secondary mt-1">{theme.subtitle}</p>
              </motion.button>
            )
          })}
        </div>

        {/* Comparison pills */}
        {activeTheme && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {activeTheme.comparisons.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveComparisonId(c.id)}
                className={`px-4 py-2 rounded-full text-sm font-body transition-all cursor-pointer focus:outline-none ${
                  activeComparisonId === c.id
                    ? 'text-white'
                    : 'bg-card text-secondary border border-border hover:border-accent'
                }`}
                style={{
                  backgroundColor: activeComparisonId === c.id ? activeTheme.color : undefined,
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}

        {/* Chart area */}
        {activeComparison && (
          <AnimatePresence mode="wait">
            <motion.div
              ref={chartContainerRef}
              key={activeComparison.id}
              className="mt-8 card p-3 md:p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="text-sm font-body font-semibold text-primary">
                    {activeComparison.title}
                    <InfoTooltip content={activeComparison.tooltip} />
                  </h3>
                  <p className="text-xs text-secondary mt-0.5">{activeComparison.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <ShareButton title={activeComparison.title} subtitle={activeComparison.subtitle} chartRef={chartContainerRef} />
                  {activeComparison.yearRange && (
                    <span className="text-[10px] font-mono text-secondary/50">
                      {activeComparison.yearRange[0]}-{activeComparison.yearRange[1]}
                    </span>
                  )}
                </div>
              </div>

              {hasData ? (
                isCustomChart ? (
                  <div className="mt-2">
                    {activeComparison.chartType === 'butterfly' && (
                      <CancerButterflyChart data={customChartData} isMobile={isMobile} />
                    )}
                    {activeComparison.chartType === 'age-bars' && (
                      <CancerAgeChart data={customChartData} isMobile={isMobile} />
                    )}
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
                  <ComposedChart data={chartData} margin={{ top: 10, right: isMobile ? 5 : 10, left: isMobile ? -15 : 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="year" tick={{ ...axisTick, fontSize: isMobile ? 10 : 11 }} stroke={axisStroke} />
                    <YAxis
                      yAxisId="left"
                      tick={{ ...axisTick, fontSize: isMobile ? 10 : 11 }}
                      stroke={axisStroke}
                      width={isMobile ? 35 : 55}
                      label={isMobile ? undefined : {
                        value: activeComparison.leftAxisLabel,
                        angle: -90,
                        position: 'insideLeft',
                        offset: 5,
                        style: { fontSize: 10, fontFamily: 'DM Sans', fill: '#9CA3AF' }
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ ...axisTick, fontSize: isMobile ? 10 : 11 }}
                      stroke={axisStroke}
                      width={isMobile ? 35 : 55}
                      label={isMobile ? undefined : {
                        value: activeComparison.rightAxisLabel,
                        angle: 90,
                        position: 'insideRight',
                        offset: 5,
                        style: { fontSize: 10, fontFamily: 'DM Sans', fill: '#9CA3AF' }
                      }}
                    />
                    <Tooltip content={<DualAxisTooltip />} />
                    <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 11, fontFamily: 'DM Sans' }} />
                    {activeComparison.series.map((s, i) => {
                      const dataKey = `s${i}`

                      if (s.type === 'bar') {
                        return (
                          <Bar
                            key={dataKey}
                            dataKey={dataKey}
                            name={s.label}
                            yAxisId={s.axis}
                            fill={s.color}
                            radius={[3, 3, 0, 0]}
                            opacity={0.8}
                            barSize={chartData.length <= 10 ? 30 : undefined}
                            isAnimationActive={true}
                            animationDuration={1000}
                          />
                        )
                      }
                      if (s.type === 'area') {
                        return (
                          <Area
                            key={dataKey}
                            dataKey={dataKey}
                            name={s.label}
                            yAxisId={s.axis}
                            connectNulls={true}
                            type="monotone"
                            stroke={s.color}
                            fill={s.color}
                            fillOpacity={0.15}
                            strokeWidth={2}
                            dot={isMobile ? false : { r: 3, fill: s.color }}
                            activeDot={{ r: 5, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
                            isAnimationActive={true}
                            animationDuration={1000}
                          />
                        )
                      }
                      return (
                        <Line
                          key={dataKey}
                          dataKey={dataKey}
                          name={s.label}
                          yAxisId={s.axis}
                          connectNulls={true}
                          type="monotone"
                          stroke={s.color}
                          strokeWidth={2}
                          dot={{ r: 3, fill: s.color }}
                          activeDot={{ r: 5, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
                          isAnimationActive={true}
                          animationDuration={1000}
                        />
                      )
                    })}
                  </ComposedChart>
                </ResponsiveContainer>
                )
              )
              : (
                <div className="h-[280px] md:h-[350px] flex items-center justify-center text-secondary text-sm">
                  Data not available for this comparison. Try another.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Data Brief */}
        {activeComparison && hasData && briefStats && (
          <div className="mt-4">
            {narratives[activeComparison.id] ? (
              <motion.div
                className="card p-4 md:p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-mono text-secondary flex items-center gap-1.5">
                    <FileText size={12} className="text-accent" />
                    Data Brief · {activeComparison.title}
                  </p>
                  <p className="text-[10px] font-mono text-secondary/40">
                    {dataPointCount > 0 && `${dataPointCount} data points`}
                    {activeComparison.yearRange && ` · ${activeComparison.yearRange[0]}–${activeComparison.yearRange[1]}`}
                  </p>
                </div>

                {/* Stat pills */}
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {briefStats.map((stat, i) => (
                    <div
                      key={i}
                      className="bg-surface rounded-xl px-3 py-2.5 text-center border border-border/50"
                    >
                      <p className={`text-lg md:text-xl font-mono font-semibold leading-tight ${
                        stat.direction === 'up' ? 'text-rose-500' :
                        stat.direction === 'down' ? 'text-emerald-600' :
                        'text-primary'
                      }`}>
                        {stat.value}
                        {stat.sparkData && (
                          <Sparkline
                            data={stat.sparkData}
                            color={stat.direction === 'down' ? '#059669' : stat.direction === 'up' ? '#F43F5E' : '#6366F1'}
                          />
                        )}
                      </p>
                      <p className="text-[10px] md:text-xs text-secondary mt-0.5 leading-tight">{stat.label}</p>
                      {stat.sublabel && (
                        <p className="text-[9px] font-mono text-secondary/40 mt-0.5">{stat.sublabel}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* AI sentence */}
                {narratives[activeComparison.id] !== '__error__' && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-sm text-primary/80 leading-relaxed italic">
                      {narratives[activeComparison.id]}
                    </p>
                  </div>
                )}

                {/* Provenance footer */}
                <p className="mt-2 text-[9px] text-secondary/30 font-mono">
                  Generated {new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })} · Source: SingStat, MOH · Correlation ≠ causation
                </p>
              </motion.div>
            ) : (
              <button
                onClick={generateNarrative}
                disabled={narrativeLoading}
                className="mx-auto flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-body transition-all cursor-pointer border border-border hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {narrativeLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating brief...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Generate Data Brief
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
