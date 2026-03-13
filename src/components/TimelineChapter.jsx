import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Legend, Label
} from 'recharts'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import healthData from '../data/health-indicators.json'

const chartColors = {
  diabetes: '#0D9488',
  hypertension: '#F59E0B',
  obesity: '#EF4444',
  smoking: '#6B7280'
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs border border-border">
      <p className="font-mono font-semibold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

function Chapter1() {
  const data = healthData.life_expectancy.data
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} stroke="#E5E7EB" />
        <YAxis domain={[60, 85]} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} stroke="#E5E7EB" />
        <Tooltip content={<CustomTooltip />} />
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
          name="Life Expectancy"
          isAnimationActive={true}
          animationDuration={1500}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function Chapter2() {
  const years = [1992, 1998, 2004, 2010]
  const combined = years.map(year => ({
    year,
    diabetes: healthData.diabetes_prevalence.data.find(d => d.year === year)?.value,
    hypertension: healthData.hypertension_prevalence.data.find(d => d.year === year)?.value,
    obesity: healthData.obesity_prevalence.data.find(d => d.year === year)?.value,
    smoking: healthData.daily_smoking_rate.data.find(d => d.year === year)?.value
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={combined}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} stroke="#E5E7EB" />
        <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} stroke="#E5E7EB" />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Sans' }} />
        <ReferenceLine x={2006} stroke="#0D9488" strokeDasharray="3 3">
          <Label value="CDMP" position="top" fill="#0D9488" fontSize={10} />
        </ReferenceLine>
        <Line type="monotone" dataKey="diabetes" stroke={chartColors.diabetes} strokeWidth={2} dot={{ r: 3 }} name="Diabetes" />
        <Line type="monotone" dataKey="hypertension" stroke={chartColors.hypertension} strokeWidth={2} dot={{ r: 3 }} name="Hypertension" />
        <Line type="monotone" dataKey="obesity" stroke={chartColors.obesity} strokeWidth={2} dot={{ r: 3 }} name="Obesity" />
        <Line type="monotone" dataKey="smoking" stroke={chartColors.smoking} strokeWidth={2} dot={{ r: 3 }} name="Smoking" />
      </LineChart>
    </ResponsiveContainer>
  )
}

function Chapter3() {
  const years = [2010, 2017, 2020, 2022]
  const combined = years.map(year => ({
    year,
    diabetes: healthData.diabetes_prevalence.data.find(d => d.year === year)?.value,
    hypertension: healthData.hypertension_prevalence.data.find(d => d.year === year)?.value,
    obesity: healthData.obesity_prevalence.data.find(d => d.year === year)?.value,
    smoking: healthData.daily_smoking_rate.data.find(d => d.year === year)?.value
  }))

  const expenditure = healthData.govt_health_expenditure.data

  return (
    <div className="space-y-6">
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={combined}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} stroke="#E5E7EB" />
          <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} stroke="#E5E7EB" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Sans' }} />
          <ReferenceLine x={2020} stroke="#EF4444" strokeDasharray="3 3">
            <Label value="COVID-19" position="top" fill="#EF4444" fontSize={10} />
          </ReferenceLine>
          <Line type="monotone" dataKey="diabetes" stroke={chartColors.diabetes} strokeWidth={2} dot={{ r: 3 }} name="Diabetes" />
          <Line type="monotone" dataKey="hypertension" stroke={chartColors.hypertension} strokeWidth={2} dot={{ r: 3 }} name="Hypertension" />
          <Line type="monotone" dataKey="obesity" stroke={chartColors.obesity} strokeWidth={2} dot={{ r: 3 }} name="Obesity" />
          <Line type="monotone" dataKey="smoking" stroke={chartColors.smoking} strokeWidth={2} dot={{ r: 3 }} name="Smoking" />
        </LineChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={expenditure}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} stroke="#E5E7EB" />
          <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} stroke="#E5E7EB" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} name="Expenditure ($B)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const chapters = [
  {
    era: '1965–1990',
    title: 'Building the Foundation',
    narrative: "Singapore's early public health story was one of conquering infectious diseases, building hospital infrastructure, and establishing Medisave — the world's first compulsory medical savings scheme. Life expectancy leapt from 65 to 75 years in just 25 years, a transformation that rivalled any nation on Earth.",
    chart: Chapter1
  },
  {
    era: '1990–2010',
    title: 'The Chronic Disease Shift',
    narrative: "As infectious diseases retreated, chronic conditions took centre stage. The first National Health Survey in 1992 established baseline numbers — diabetes at 7.3%, daily smoking at 18.3%. By 2010, diabetes had risen to 8.6% and obesity had doubled to 10.8% — a wake-up call that the nation's health challenges had fundamentally changed.",
    chart: Chapter2
  },
  {
    era: '2010–Present',
    title: 'War on Diabetes & COVID',
    narrative: "The government declared a War on Diabetes in 2016. Then COVID-19 hit — disrupting everything. Health expenditure surged past $15B. But smoking hit historic lows and Healthier SG signalled a fundamental shift to prevention.",
    chart: Chapter3
  },
  {
    era: '2030',
    title: 'The Road Ahead',
    narrative: "By 2030, 1 in 4 Singaporeans will be 65 or older. Multimorbidity is rising. Mental health is emerging as a priority. The question isn't whether the system will be tested — it's whether the shift to prevention came soon enough.",
    chart: null
  }
]

export default function TimelineChapter({ chapter, index }) {
  const [ref, isVisible] = useScrollAnimation(0.15)
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

      <div className="card p-6 md:p-8">
        <span className="inline-block px-3 py-1 rounded-full bg-grid text-xs font-mono text-secondary">
          {ch.era}
        </span>
        <h3 className="mt-3 text-xl md:text-2xl font-heading text-primary">{ch.title}</h3>
        <p className="mt-3 text-secondary text-base leading-relaxed">{ch.narrative}</p>

        {ChartComponent && (
          <div className="mt-6">
            <ChartComponent />
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
