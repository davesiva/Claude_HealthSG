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
  { key: 'binge_drinking', label: 'Binge Drinking' },
  { key: 'childhood_obesity', label: 'Child Obesity' },
  { key: 'health_personnel', label: 'Doctors' },
  { key: 'hospital_beds', label: 'Hospital Beds' },
  { key: 'psychiatric_admissions', label: 'Psych Admissions' },
  { key: 'tb_incidence', label: 'TB Rate' },
  { key: 'aged_65_plus', label: 'Aged 65+' },
  { key: 'old_age_support_ratio', label: 'Support Ratio' },
  { key: 'total_fertility_rate', label: 'Fertility Rate' }
]

const demographicColors = {
  male: '#0D9488',
  female: '#F59E0B',
  chinese: '#0D9488',
  malay: '#F59E0B',
  indian: '#EF4444'
}

// Better contrast axis styles
const axisTick = { fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#6B7280' }
const axisStroke = '#D1D5DB'

const descriptions = {
  diabetes_prevalence: {
    text: 'Percentage of Singapore residents aged 18-69 diagnosed with diabetes mellitus. Measured via fasting blood glucose \u2265 7.0 mmol/L, HbA1c \u2265 6.5%, or on medication.',
    survey: 'National Population Health Survey (NPHS), conducted every 3-6 years by MOH.',
    note: 'Survey methodology changed over the years \u2014 pre-2010 data used different age ranges and diagnostic criteria, so direct comparisons should be made with caution.'
  },
  hypertension_prevalence: {
    text: 'Percentage of residents with systolic blood pressure \u2265 140 mmHg or diastolic \u2265 90 mmHg, or currently on blood pressure medication.',
    survey: 'National Population Health Survey (NPHS) by MOH.',
    note: 'From 2020, NPHS adopted a new methodology using the average of multiple BP readings and expanded age range. This caused reported prevalence to jump from 24.2% (2017) to 35.5% (2020). The increase is largely methodological, not a real surge in hypertension.'
  },
  obesity_prevalence: {
    text: 'Percentage of residents with BMI \u2265 30 kg/m\u00B2. Note: WHO recommends Asian-specific cut-offs where BMI \u2265 27.5 is "high risk" for chronic disease.',
    survey: 'National Population Health Survey (NPHS) by MOH.',
    note: 'Based on measured (not self-reported) height and weight.'
  },
  high_cholesterol_prevalence: {
    text: 'Percentage of residents with total blood cholesterol \u2265 6.2 mmol/L, or currently on lipid-lowering medication. Also called hyperlipidaemia.',
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
    text: 'Percentage of Singapore residents meeting WHO-recommended levels of physical activity \u2014 at least 150 minutes of moderate-intensity or 75 minutes of vigorous-intensity activity per week.',
    survey: 'National Population Health Survey (NPHS) by MOH.',
    note: 'Self-reported via the Global Physical Activity Questionnaire (GPAQ). The decline from 2019 may partly reflect COVID-19 restrictions on exercise facilities and outdoor activities.'
  },
  binge_drinking: {
    text: 'Percentage of Singapore residents who engaged in binge drinking (5 or more standard drinks on a single occasion for men, 4 or more for women) in the past month.',
    survey: 'National Population Health Survey (NPHS) by MOH.',
    note: 'Self-reported. The steady increase over time reflects changing social drinking patterns in Singapore. Binge drinking is a risk factor for liver disease, injuries, and cardiovascular events.'
  },
  childhood_obesity: {
    text: 'Prevalence of overweight and severely overweight (obesity) among Primary 1 children (~7 years old), measured during annual School Health Service screenings.',
    survey: 'Health Promotion Board, School Health Service. SingStat Table M870381.',
    note: 'The 2021 spike (13.4%) likely reflects reduced physical activity during COVID-19 school closures. The recent decline to 8.9% in 2024 is encouraging.'
  },
  health_personnel: {
    text: 'Number of registered doctors per 10,000 total population. Includes GPs, specialists, and house officers across public and private sectors.',
    survey: 'Ministry of Health, via SingStat Table M870001.',
    note: 'Singapore has been expanding medical school intake and recognising more overseas qualifications to grow the healthcare workforce as the population ages.'
  },
  hospital_beds: {
    text: 'Total number of acute hospital beds (public, not-for-profit, and private). Does not include community hospital or psychiatric beds.',
    survey: 'Ministry of Health, via SingStat Table M870301.',
    note: 'New hospitals (e.g. Woodlands Health Campus, Sengkang General) have added capacity. Bed growth must keep pace with the aging population.'
  },
  psychiatric_admissions: {
    text: 'Annual admissions to public psychiatric hospitals in Singapore, primarily the Institute of Mental Health (IMH).',
    survey: 'Ministry of Health, via SingStat Table M870311.',
    note: 'The steady increase from 2021 may reflect growing mental health needs post-COVID and reduced stigma. Does not capture private psychiatric care or outpatient visits.'
  },
  tb_incidence: {
    text: 'Incidence rate of tuberculosis per 100,000 population. Singapore has an intermediate TB burden compared to other developed nations.',
    survey: 'Ministry of Health, via SingStat Table M870361.',
    note: 'TB remains a notifiable disease. The decline in 2023-2024 is encouraging and may reflect improved screening. Singapore aims to reduce TB to a pre-elimination threshold.'
  },
  aged_65_plus: {
    text: 'Percentage of the Singapore resident population aged 65 years and over. Calculated from total resident population figures by age group.',
    survey: 'Department of Statistics Singapore (SingStat), Table M810011.',
    note: 'Singapore is one of the fastest-aging societies in Asia. The proportion aged 65+ has more than doubled since 2000. By 2030, roughly 1 in 4 residents will be 65 or older, placing increasing demands on healthcare and social support systems.'
  },
  old_age_support_ratio: {
    text: 'The number of working-age residents (aged 20-64) per elderly resident (aged 65+). A declining ratio means fewer working-age adults available to support each elderly person.',
    survey: 'Department of Statistics Singapore (SingStat), Table M810001.',
    note: 'The ratio has fallen sharply from nearly 10 in 2000 to around 3.5 in 2024, signalling growing fiscal pressure on healthcare funding, CPF/pension sustainability, and eldercare services.'
  },
  total_fertility_rate: {
    text: 'The average number of live births a woman would have over her lifetime if current age-specific fertility rates persist. A TFR of 2.1 is the "replacement level" needed to maintain population size without immigration.',
    survey: 'Department of Statistics Singapore (SingStat), Table M810091.',
    note: 'Singapore\'s TFR has been well below replacement since the 1980s and reached a historic low of 0.87 in 2025 (preliminary) \u2014 one of the lowest globally. This is the root driver of population aging.'
  }
}

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white px-3 py-2 text-xs border border-border rounded-lg shadow-md">
      <p className="font-mono font-semibold text-primary">{label}</p>
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

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
  const isBarChart = activeKey === 'govt_health_expenditure' || activeKey === 'hospital_beds' || activeKey === 'psychiatric_admissions'
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
    <section className="py-20 md:py-30 px-4 md:px-6" id="explorer">
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
              className={`px-4 py-2 rounded-full text-sm font-body transition-all cursor-pointer focus:outline-none ${
                activeKey === key
                  ? 'bg-accent text-white'
                  : 'bg-card text-secondary border border-border hover:border-accent'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="mt-8 card p-3 md:p-6 focus:outline-none" tabIndex={-1} style={{ WebkitTapHighlightColor: 'transparent' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-body font-semibold text-primary">
              {indicator.label}
              <span className="ml-1 text-secondary font-normal">({indicator.unit})</span>
            </h3>
            <span className="text-[10px] font-mono text-secondary/50">
              {chartData[0]?.year}-{chartData[chartData.length - 1]?.year}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 260 : 300}>
            {isBarChart && breakdown === 'all' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="year" tick={axisTick} stroke={axisStroke} />
                <YAxis tick={axisTick} stroke={axisStroke} width={isMobile ? 35 : 55} />
                <Tooltip content={<CustomTooltip unit={indicator.unit === '$B' ? 'B' : indicator.unit} />} />
                <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} name={indicator.label} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="year" tick={axisTick} stroke={axisStroke} />
                <YAxis tick={axisTick} stroke={axisStroke} width={isMobile ? 35 : 55} />
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
                    activeDot={{ r: 5, fill: line.color, stroke: '#fff', strokeWidth: 2 }}
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
              className={`px-4 py-1.5 rounded-full text-xs font-body transition-all cursor-pointer focus:outline-none ${
                breakdown === 'all' ? 'bg-accent text-white' : 'bg-card text-secondary border border-border'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              All
            </button>
            {hasGender && (
              <button
                onClick={() => setBreakdown('gender')}
                className={`px-4 py-1.5 rounded-full text-xs font-body transition-all cursor-pointer focus:outline-none ${
                  breakdown === 'gender' ? 'bg-accent text-white' : 'bg-card text-secondary border border-border'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                By Gender
              </button>
            )}
            {hasEthnicity && (
              <button
                onClick={() => setBreakdown('ethnicity')}
                className={`px-4 py-1.5 rounded-full text-xs font-body transition-all cursor-pointer focus:outline-none ${
                  breakdown === 'ethnicity' ? 'bg-accent text-white' : 'bg-card text-secondary border border-border'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
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
