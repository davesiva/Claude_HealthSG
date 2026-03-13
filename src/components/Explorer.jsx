import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useHealthData } from '../context/HealthDataContext'
import InfoTooltip from './InfoTooltip'

const indicatorKeys = [
  { key: 'diabetes_prevalence', label: 'Diabetes' },
  { key: 'hypertension_prevalence', label: 'Hypertension' },
  { key: 'obesity_prevalence', label: 'Obesity' },
  { key: 'high_cholesterol_prevalence', label: 'Cholesterol' },
  { key: 'daily_smoking_rate', label: 'Smoking' },
  { key: 'life_expectancy', label: 'Life Expectancy' },
  { key: 'govt_health_expenditure', label: 'Health Spend' },
  { key: 'chronic_disease_screening', label: 'Screening' },
  { key: 'physical_activity', label: 'Physical Activity' },
  { key: 'binge_drinking', label: 'Binge Drinking' }
]

const demographicColors = {
  male: '#0D9488',
  female: '#F59E0B',
  chinese: '#0D9488',
  malay: '#F59E0B',
  indian: '#EF4444'
}

const descriptions = {
  diabetes_prevalence: {
    text: 'Percentage of Singapore residents aged 18-69 diagnosed with diabetes mellitus. Measured via fasting blood glucose ≥ 7.0 mmol/L, HbA1c ≥ 6.5%, or on medication.',
    survey: 'National Population Health Survey (NPHS), conducted every 3-6 years by MOH.',
    note: 'Survey methodology changed over the years — pre-2010 data used different age ranges and diagnostic criteria, so direct comparisons should be made with caution.'
  },
  hypertension_prevalence: {
    text: 'Percentage of residents with systolic blood pressure ≥ 140 mmHg or diastolic ≥ 90 mmHg, or currently on blood pressure medication.',
    survey: 'National Population Health Survey (NPHS) by MOH.',
    note: 'From 2020, NPHS adopted a new methodology using the average of multiple BP readings and expanded age range. This caused reported prevalence to jump from 24.2% (2017) to 35.5% (2020). The increase is largely methodological, not a real surge in hypertension.'
  },
  obesity_prevalence: {
    text: 'Percentage of residents with BMI ≥ 30 kg/m². Note: WHO recommends Asian-specific cut-offs where BMI ≥ 27.5 is "high risk" for chronic disease.',
    survey: 'National Population Health Survey (NPHS) by MOH.',
    note: 'Based on measured (not self-reported) height and weight.'
  },
  high_cholesterol_prevalence: {
    text: 'Percentage of residents with total blood cholesterol ≥ 6.2 mmol/L, or currently on lipid-lowering medication. Also called hyperlipidaemia.',
    survey: 'National Population Health Survey (NPHS) by MOH.',
    note: 'The sharp rise in 2017 may partly reflect changes in diagnostic criteria and increased screening.'
  },
  daily_smoking_rate: {
    text: 'Percentage of residents aged 18-69 who smoke at least one cigarette per day. Does not include occasional or e-cigarette users.',
    survey: 'National Population Health Survey (NPHS) by MOH.',
    note: 'Singapore has one of the strictest tobacco control regimes globally, including plain packaging and high taxes.'
  },
  life_expectancy: {
    text: 'The average number of years a newborn baby is expected to live, assuming current age-specific mortality rates persist. Singapore consistently ranks in the global top 5.',
    survey: 'Department of Statistics Singapore (SingStat), based on complete life tables.',
    note: 'The dip in 2020 reflects excess mortality during the COVID-19 pandemic.'
  },
  govt_health_expenditure: {
    text: 'Total Singapore government spending on healthcare, including operating expenditure (hospitals, polyclinics, subsidies) and development expenditure (new facilities).',
    survey: 'Ministry of Health annual budget reports.',
    note: 'The sharp increase from 2020 onwards includes COVID-19 response costs. These are nominal figures (not adjusted for inflation).'
  },
  chronic_disease_screening: {
    text: 'Percentage of Singapore residents who were screened for chronic diseases (diabetes, hypertension, hyperlipidaemia) at the recommended frequency.',
    survey: 'National Population Health Survey (NPHS) by MOH.',
    note: 'The Screen for Life programme subsidises these screenings at CHAS GP clinics and polyclinics. Higher rates indicate better preventive health behaviour.'
  },
  physical_activity: {
    text: 'Percentage of Singapore residents meeting WHO-recommended levels of physical activity — at least 150 minutes of moderate-intensity or 75 minutes of vigorous-intensity activity per week.',
    survey: 'National Population Health Survey (NPHS) by MOH.',
    note: 'Self-reported via the Global Physical Activity Questionnaire (GPAQ). The decline from 2019 may partly reflect COVID-19 restrictions on exercise facilities and outdoor activities.'
  },
  binge_drinking: {
    text: 'Percentage of Singapore residents who engaged in binge drinking (5 or more standard drinks on a single occasion for men, 4 or more for women) in the past month.',
    survey: 'National Population Health Survey (NPHS) by MOH.',
    note: 'Self-reported. The steady increase over time reflects changing social drinking patterns in Singapore. Binge drinking is a risk factor for liver disease, injuries, and cardiovascular events.'
  }
}

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs border border-border">
      <p className="font-mono font-semibold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name}: {p.value}{unit || ''}
        </p>
      ))}
    </div>
  )
}

export default function Explorer({ selectedIndicator }) {
  const { healthData } = useHealthData()
  const [activeKey, setActiveKey] = useState(selectedIndicator || 'diabetes_prevalence')
  const [breakdown, setBreakdown] = useState('all')
  const [ref, isVisible] = useScrollAnimation(0.1)

  useEffect(() => {
    if (selectedIndicator) {
      setActiveKey(selectedIndicator)
      setBreakdown('all')
    }
  }, [selectedIndicator])

  const indicator = healthData[activeKey]
  if (!indicator) return null

  const hasGender = indicator.by_gender != null
  const hasEthnicity = indicator.by_ethnicity != null
  const isBarChart = activeKey === 'govt_health_expenditure'
  const desc = descriptions[activeKey]

  let chartData = indicator.data
  let lines = [{ key: 'value', name: indicator.label, color: '#0D9488' }]

  if (breakdown === 'gender' && hasGender) {
    const allYears = new Set()
    Object.values(indicator.by_gender).forEach(arr => arr.forEach(d => allYears.add(d.year)))
    chartData = [...allYears].sort((a, b) => a - b).map(year => {
      const row = { year }
      Object.entries(indicator.by_gender).forEach(([gender, arr]) => {
        const found = arr.find(d => d.year === year)
        if (found) row[gender] = found.value
      })
      return row
    })
    lines = Object.keys(indicator.by_gender).map(g => ({
      key: g,
      name: g.charAt(0).toUpperCase() + g.slice(1),
      color: demographicColors[g]
    }))
  } else if (breakdown === 'ethnicity' && hasEthnicity) {
    const allYears = new Set()
    Object.values(indicator.by_ethnicity).forEach(arr => arr.forEach(d => allYears.add(d.year)))
    chartData = [...allYears].sort((a, b) => a - b).map(year => {
      const row = { year }
      Object.entries(indicator.by_ethnicity).forEach(([eth, arr]) => {
        const found = arr.find(d => d.year === year)
        if (found) row[eth] = found.value
      })
      return row
    })
    lines = Object.keys(indicator.by_ethnicity).map(e => ({
      key: e,
      name: e.charAt(0).toUpperCase() + e.slice(1),
      color: demographicColors[e]
    }))
  }

  return (
    <section className="py-20 md:py-30 px-6" id="explorer">
      <div className="max-w-[960px] mx-auto">
        <motion.h2
          ref={ref}
          className="font-heading text-3xl md:text-4xl text-primary text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          Explore the Data
          <InfoTooltip content="Select an indicator below to view its full historical time series. Toggle between overall, gender, and ethnicity breakdowns where data is available." />
        </motion.h2>

        {/* Indicator pills */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {indicatorKeys.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setActiveKey(key); setBreakdown('all') }}
              className={`px-4 py-2 rounded-full text-sm font-body transition-all cursor-pointer ${
                activeKey === key
                  ? 'bg-accent text-white'
                  : 'bg-card text-secondary border border-border hover:border-accent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="mt-8 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-body font-semibold text-primary">
              {indicator.label}
              <span className="ml-1 text-secondary font-normal">({indicator.unit})</span>
            </h3>
            <span className="text-[10px] font-mono text-secondary/50">
              {chartData[0]?.year}–{chartData[chartData.length - 1]?.year}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {isBarChart && breakdown === 'all' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} stroke="#E5E7EB" />
                <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} stroke="#E5E7EB" />
                <Tooltip content={<CustomTooltip unit={indicator.unit === '$B' ? 'B' : indicator.unit} />} />
                <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} name={indicator.label} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} stroke="#E5E7EB" />
                <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} stroke="#E5E7EB" />
                <Tooltip content={<CustomTooltip unit={indicator.unit === '%' ? '%' : ''} />} />
                {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Sans' }} />}
                {lines.map(line => (
                  <Line
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    stroke={line.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: line.color }}
                    name={line.name}
                    connectNulls
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Demographic toggles */}
        {(hasGender || hasEthnicity) && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setBreakdown('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-body transition-all cursor-pointer ${
                breakdown === 'all' ? 'bg-accent text-white' : 'bg-card text-secondary border border-border'
              }`}
            >
              All
            </button>
            {hasGender && (
              <button
                onClick={() => setBreakdown('gender')}
                className={`px-4 py-1.5 rounded-full text-xs font-body transition-all cursor-pointer ${
                  breakdown === 'gender' ? 'bg-accent text-white' : 'bg-card text-secondary border border-border'
                }`}
              >
                By Gender
              </button>
            )}
            {hasEthnicity && (
              <button
                onClick={() => setBreakdown('ethnicity')}
                className={`px-4 py-1.5 rounded-full text-xs font-body transition-all cursor-pointer ${
                  breakdown === 'ethnicity' ? 'bg-accent text-white' : 'bg-card text-secondary border border-border'
                }`}
              >
                By Ethnicity
              </button>
            )}
            <InfoTooltip content={
              breakdown === 'gender'
                ? 'Showing prevalence rates split by male and female residents. Gender data comes from the NPHS and may not be available for all survey years.'
                : breakdown === 'ethnicity'
                ? 'Showing prevalence rates by ethnic group (Chinese, Malay, Indian). Ethnicity data comes from earlier NHS surveys and may have limited year coverage.'
                : 'Showing the overall population rate. Use the toggles to see breakdowns by gender or ethnicity where available.'
            } />
          </div>
        )}

        {/* Info card */}
        {desc && (
          <div className="mt-4 card p-5 text-sm text-secondary space-y-2">
            <p>{desc.text}</p>
            <p className="text-xs text-secondary/60">
              <span className="font-semibold">Survey:</span> {desc.survey}
            </p>
            {desc.note && (
              <p className="text-xs text-secondary/50 italic">{desc.note}</p>
            )}
            <p className="text-xs text-secondary/40 font-mono">Source: {indicator.source}</p>
          </div>
        )}
      </div>
    </section>
  )
}
