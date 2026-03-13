import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useCountUp } from '../hooks/useCountUp'
import { useHealthData } from '../context/HealthDataContext'
import InfoTooltip from './InfoTooltip'

const indicators = [
  { key: 'life_expectancy' },
  { key: 'diabetes_prevalence' },
  { key: 'hypertension_prevalence' },
  { key: 'obesity_prevalence' },
  { key: 'daily_smoking_rate' },
  { key: 'govt_health_expenditure' },
  { key: 'high_cholesterol_prevalence' },
  { key: 'chronic_disease_screening' },
  { key: 'physical_activity' },
  { key: 'aged_65_plus' },
  { key: 'old_age_support_ratio' },
  { key: 'total_fertility_rate' }
]

// Keys where an increase is a positive/good trend
const positiveUpKeys = new Set([
  'life_expectancy', 'govt_health_expenditure',
  'chronic_disease_screening', 'physical_activity',
  'old_age_support_ratio', 'total_fertility_rate'
])

function getTrendTooltip(key, prev, indicator) {
  const baseline = indicator?.trendBaseline
  const baselineNote = baseline ? ` Historical baseline: ${baseline}.` : ''
  const unit = indicator?.unit === '$B' ? `$${prev.value}B` : `${prev.value}${indicator?.unit || ''}`

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
    ? (isUp ? '#0D9488' : '#EF4444')
    : (isUp ? '#EF4444' : '#0D9488')

  const tooltipContent = indicator.tooltip || indicator.description || ''

  return (
    <motion.div
      ref={ref}
      className="card p-5 cursor-pointer hover:card-hover focus:outline-none"
      style={{ WebkitTapHighlightColor: 'transparent' }}
      initial={{ opacity: 0, y: 20 }}
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
          <InfoTooltip
            content={getTrendTooltip(indicatorKey, previous, indicator)}
            size={11}
          />
        </div>
      )}

      <div className="mt-3 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0D9488"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={isVisible}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-1 text-[10px] text-secondary/40 font-mono">
        {data[0].year}–{latest.year}
      </p>
    </motion.div>
  )
}

export default function Snapshot({ onSelectIndicator }) {
  const [ref, isVisible] = useScrollAnimation(0.1)
  const { healthData, dataStatus } = useHealthData()

  return (
    <section className="py-20 md:py-30 px-6" id="snapshot">
      <div className="max-w-[960px] mx-auto">
        <motion.div
          ref={ref}
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-heading text-3xl md:text-4xl text-primary">
            Singapore at a Glance
          </h2>
          <p className="mt-2 text-xs text-secondary/60 font-mono">
            {dataStatus === 'live' ? 'Live data from SingStat & data.gov.sg' : 'Data from MOH / SingStat'}
            <InfoTooltip content="Health indicator data is fetched live from the SingStat Table Builder API (tablebuilder.singstat.gov.sg). Sources include MOH National Population Health Survey, Department of Statistics, and NEA. Data is cached for 24 hours on the server." />
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4">
          {indicators.map(({ key }) => (
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
    </section>
  )
}
