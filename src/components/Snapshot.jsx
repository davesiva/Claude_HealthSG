import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useCountUp } from '../hooks/useCountUp'
import { useHealthData } from '../context/HealthDataContext'
import InfoTooltip from './InfoTooltip'

const indicators = [
  { key: 'life_expectancy', trendUp: true },
  { key: 'diabetes_prevalence', trendUp: false },
  { key: 'hypertension_prevalence', trendUp: false },
  { key: 'obesity_prevalence', trendUp: false },
  { key: 'daily_smoking_rate', trendUp: false },
  { key: 'govt_health_expenditure', trendUp: true },
  { key: 'high_cholesterol_prevalence', trendUp: false }
]

const cardTooltips = {
  life_expectancy: 'Average years a newborn is expected to live, based on current mortality rates. Source: Department of Statistics Singapore.',
  diabetes_prevalence: 'Percentage of Singapore residents aged 18-69 with diabetes, from the National Population Health Survey (NPHS).',
  hypertension_prevalence: 'Percentage of residents with systolic BP ≥ 140 mmHg or diastolic BP ≥ 90 mmHg, or on medication. Source: MOH NPHS.',
  obesity_prevalence: 'Percentage of residents with BMI ≥ 30 kg/m². Note: Singapore uses Asian BMI cut-offs where ≥ 27.5 is "high risk". Source: MOH NPHS.',
  daily_smoking_rate: 'Percentage of residents who smoke at least one cigarette per day. Source: MOH NPHS.',
  govt_health_expenditure: 'Total government spending on healthcare in Singapore dollars (billions). Includes operating and development expenditure. Source: MOH.',
  high_cholesterol_prevalence: 'Percentage of residents with total blood cholesterol ≥ 6.2 mmol/L or on lipid-lowering medication. Source: MOH NPHS.'
}

const trendTooltips = {
  life_expectancy: (prev, latest) => `Compared to ${prev.year} (${prev.value} yrs). A higher value means longer life expectancy — positive trend.`,
  diabetes_prevalence: (prev, latest) => `Compared to ${prev.year} (${prev.value}%). Lower is better — a decrease means fewer people have diabetes.`,
  hypertension_prevalence: (prev, latest) => `Compared to ${prev.year} (${prev.value}%). Lower is better — measures the change in high blood pressure rates.`,
  obesity_prevalence: (prev, latest) => `Compared to ${prev.year} (${prev.value}%). Lower is better — a decrease means fewer people are obese.`,
  daily_smoking_rate: (prev, latest) => `Compared to ${prev.year} (${prev.value}%). Lower is better — a decrease means fewer daily smokers.`,
  govt_health_expenditure: (prev, latest) => `Compared to ${prev.year} ($${prev.value}B). Higher spending reflects expanded healthcare coverage and an ageing population.`,
  high_cholesterol_prevalence: (prev, latest) => `Compared to ${prev.year} (${prev.value}%). Lower is better — a decrease means fewer people with high cholesterol.`
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

  const trendColor = indicatorKey === 'life_expectancy' || indicatorKey === 'govt_health_expenditure'
    ? (isUp ? '#0D9488' : '#EF4444')
    : (isUp ? '#EF4444' : '#0D9488')

  return (
    <motion.div
      ref={ref}
      className="card p-5 cursor-pointer hover:card-hover"
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      onClick={() => onSelect(indicatorKey)}
    >
      <div className="flex items-start gap-1">
        <p className="text-sm text-secondary font-body truncate flex-1">{indicator.label}</p>
        <InfoTooltip content={cardTooltips[indicatorKey]} size={13} />
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
            content={trendTooltips[indicatorKey]?.(previous, latest) || `Compared to previous data point in ${previous.year}.`}
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
            {dataStatus === 'live' ? 'Live data from data.gov.sg' : 'Data from MOH / SingStat'}
            <InfoTooltip content="Data is fetched live from data.gov.sg APIs when available. Health expenditure uses MOH published figures. All prevalence data comes from the National Population Health Survey (NPHS) conducted by MOH." />
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
