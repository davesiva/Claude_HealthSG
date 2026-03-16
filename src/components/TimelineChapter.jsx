import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, Legend, Label
} from 'recharts'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import healthData from '../data/health-indicators.json'

const chartColors = {
  diabetes: '#0D9488',
  hypertension: '#F59E0B',
  obesity: '#EF4444',
  smoking: '#6B7280'
}

// Axis tick style — darker for better contrast
const axisTick = { fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#6B7280' }
const axisStroke = '#D1D5DB'

function SimpleTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white px-3 py-2 text-xs border border-border rounded-lg shadow-md">
      <p className="font-mono font-semibold text-primary">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name}: {p.value}%
        </p>
      ))}
    </div>
  )
}

function SimpleBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white px-3 py-2 text-xs border border-border rounded-lg shadow-md">
      <p className="font-mono font-semibold text-primary">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name}: ${p.value}B
        </p>
      ))}
    </div>
  )
}

function LifeExpTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white px-3 py-2 text-xs border border-border rounded-lg shadow-md">
      <p className="font-mono font-semibold text-primary">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name}: {p.value} yrs
        </p>
      ))}
    </div>
  )
}

function Chapter1({ isMobile }) {
  const data = healthData.life_expectancy.data
  return (
    <div className="outline-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
      <ResponsiveContainer width="100%" height={isMobile ? 220 : 250}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: isMobile ? -15 : 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="year" tick={axisTick} stroke={axisStroke} />
          <YAxis domain={[60, 85]} tick={axisTick} stroke={axisStroke} width={isMobile ? 35 : 55} />
          <Tooltip content={<LifeExpTooltip />} />
          <ReferenceArea x1={1960} x2={1990} fill="#0D9488" fillOpacity={0.05} />
          <ReferenceLine x={1984} stroke="#0D9488" strokeDasharray="3 3">
            <Label value="Medisave" position="top" fill="#0D9488" fontSize={10} />
          </ReferenceLine>
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0D9488"
            strokeWidth={2}
            dot={{ r: 3, fill: '#0D9488' }}
            activeDot={{ r: 5, fill: '#0D9488', stroke: '#fff', strokeWidth: 2 }}
            name="Life Expectancy"
            isAnimationActive={true}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function Chapter2({ isMobile }) {
  // Use actual available years from the dataset
  const allYears = new Set()
  const keys = ['diabetes_prevalence', 'hypertension_prevalence', 'obesity_prevalence', 'daily_smoking_rate']
  keys.forEach(k => {
    healthData[k]?.data?.forEach(d => allYears.add(d.year))
  })
  const sortedYears = [...allYears].sort((a, b) => a - b).filter(y => y <= 2010)

  const combined = sortedYears.map(year => ({
    year,
    diabetes: healthData.diabetes_prevalence.data.find(d => d.year === year)?.value,
    hypertension: healthData.hypertension_prevalence.data.find(d => d.year === year)?.value,
    obesity: healthData.obesity_prevalence.data.find(d => d.year === year)?.value,
    smoking: healthData.daily_smoking_rate.data.find(d => d.year === year)?.value
  })).filter(d => d.diabetes != null || d.hypertension != null || d.obesity != null || d.smoking != null)

  return (
    <div className="outline-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
      <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
        <LineChart data={combined} margin={{ top: 5, right: 5, left: isMobile ? -15 : 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="year" tick={axisTick} stroke={axisStroke} />
          <YAxis tick={axisTick} stroke={axisStroke} width={isMobile ? 35 : 55} />
          <Tooltip content={<SimpleTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Sans' }} />
          <Line type="monotone" dataKey="diabetes" stroke={chartColors.diabetes} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Diabetes" />
          <Line type="monotone" dataKey="hypertension" stroke={chartColors.hypertension} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Hypertension" />
          <Line type="monotone" dataKey="obesity" stroke={chartColors.obesity} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Obesity" />
          <Line type="monotone" dataKey="smoking" stroke={chartColors.smoking} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Smoking" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function Chapter3({ isMobile }) {
  // Use actual available years >= 2010 from the dataset
  const allYears = new Set()
  const keys = ['diabetes_prevalence', 'hypertension_prevalence', 'obesity_prevalence', 'daily_smoking_rate']
  keys.forEach(k => {
    healthData[k]?.data?.forEach(d => { if (d.year >= 2010) allYears.add(d.year) })
  })
  const sortedYears = [...allYears].sort((a, b) => a - b)

  const combined = sortedYears.map(year => ({
    year,
    diabetes: healthData.diabetes_prevalence.data.find(d => d.year === year)?.value,
    hypertension: healthData.hypertension_prevalence.data.find(d => d.year === year)?.value,
    obesity: healthData.obesity_prevalence.data.find(d => d.year === year)?.value,
    smoking: healthData.daily_smoking_rate.data.find(d => d.year === year)?.value
  })).filter(d => d.diabetes != null || d.hypertension != null || d.obesity != null || d.smoking != null)

  const expenditure = healthData.govt_health_expenditure.data

  return (
    <div className="space-y-6 outline-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
      <ResponsiveContainer width="100%" height={isMobile ? 220 : 250}>
        <LineChart data={combined} margin={{ top: 5, right: 5, left: isMobile ? -15 : 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="year" tick={axisTick} stroke={axisStroke} />
          <YAxis tick={axisTick} stroke={axisStroke} width={isMobile ? 35 : 55} />
          <Tooltip content={<SimpleTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Sans' }} />
          <Line type="monotone" dataKey="diabetes" stroke={chartColors.diabetes} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Diabetes" />
          <Line type="monotone" dataKey="hypertension" stroke={chartColors.hypertension} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Hypertension" />
          <Line type="monotone" dataKey="obesity" stroke={chartColors.obesity} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Obesity" />
          <Line type="monotone" dataKey="smoking" stroke={chartColors.smoking} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Smoking" />
        </LineChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
        <BarChart data={expenditure} margin={{ top: 5, right: 5, left: isMobile ? -15 : 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="year" tick={axisTick} stroke={axisStroke} />
          <YAxis tick={axisTick} stroke={axisStroke} width={isMobile ? 35 : 55} />
          <Tooltip content={<SimpleBarTooltip />} />
          <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} name="Health Spend" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const chapters = [
  {
    era: '1965-1990',
    title: 'Building the Foundation',
    narrative: "Singapore's early public health story was one of conquering infectious diseases, building hospital infrastructure, and establishing Medisave \u2014 the world's first compulsory medical savings scheme. Life expectancy leapt from 65 to 75 years in just 25 years, a transformation that rivalled any nation on Earth.",
    chart: Chapter1
  },
  {
    era: '1990-2010',
    title: 'The Chronic Disease Shift',
    narrative: "As infectious diseases retreated, chronic conditions took centre stage. The first National Health Survey in 1992 established baseline numbers. By 2010, diabetes had risen to 8.6% and obesity had doubled \u2014 a wake-up call that the nation's health challenges had fundamentally changed.",
    chart: Chapter2
  },
  {
    era: '2010-Present',
    title: 'War on Diabetes & Beyond',
    narrative: "The government declared a War on Diabetes in 2016. Health expenditure surged past $15B. But smoking hit historic lows and Healthier SG signalled a fundamental shift to prevention.",
    chart: Chapter3
  },
  {
    era: '2030',
    title: 'The Road Ahead',
    narrative: "By 2030, 1 in 4 Singaporeans will be 65 or older. Multimorbidity is rising. Mental health is emerging as a priority. The question isn't whether the system will be tested \u2014 it's whether the shift to prevention came soon enough.",
    chart: null
  }
]

export default function TimelineChapter({ chapter, index }) {
  const [ref, isVisible] = useScrollAnimation(0.15)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const ch = chapters[index]
  if (!ch) return null

  const ChartComponent = ch.chart

  return (
    <motion.div
      ref={ref}
      className="relative pl-8 md:pl-12 pb-12 last:pb-0"
      initial={{ opacity: 0, x: -20 }}
      animate={isVisible ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6 }}
    >
      {/* Timeline dot */}
      <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-accent border-2 border-card" />

      <div className="card p-3 md:p-8">
        <span className="inline-block px-3 py-1 rounded-full bg-grid text-xs font-mono text-secondary">
          {ch.era}
        </span>
        <h3 className="mt-3 text-xl md:text-2xl font-heading text-primary">{ch.title}</h3>
        <p className="mt-3 text-secondary text-base leading-relaxed">{ch.narrative}</p>

        {ChartComponent && (
          <div className="mt-6 focus:outline-none" tabIndex={-1} style={{ WebkitTapHighlightColor: 'transparent' }}>
            <ChartComponent isMobile={isMobile} />
          </div>
        )}

        {!ChartComponent && index === 3 && (
          <div className="mt-8 py-8 text-center">
            <p className="text-4xl md:text-5xl font-heading text-accent">1 in 4</p>
            <p className="mt-2 text-secondary text-sm">
              Singaporeans will be aged 65+ by 2030
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export { chapters }
