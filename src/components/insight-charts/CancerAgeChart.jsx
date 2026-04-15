import { useRef, useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { createScope, animate, stagger } from 'animejs'

const MALE_COLOR = '#3B82F6'
const FEMALE_COLOR = '#EC4899'

function AgeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-primary mb-1">Age {label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString(undefined, { maximumFractionDigits: 1 })} per 100k
          {p.payload && (
            <span className="text-secondary ml-1">
              ({(p.name === 'Male' ? p.payload.maleCases : p.payload.femaleCases)?.toLocaleString()} cases)
            </span>
          )}
        </p>
      ))}
    </div>
  )
}

export default function CancerAgeChart({ data, isMobile }) {
  const containerRef = useRef(null)
  const [animated, setAnimated] = useState(false)
  const scopeRef = useRef(null)

  const chartData = useMemo(() => {
    if (!data?.male || !data?.female) return []
    return data.male.map((m, i) => ({
      ageGroup: m.ageGroup,
      male: m.rate,
      female: data.female[i]?.rate || 0,
      maleCases: m.cases,
      femaleCases: data.female[i]?.cases || 0,
    }))
  }, [data])

  // anime.js entrance animation
  useEffect(() => {
    if (!containerRef.current || animated || chartData.length === 0) return

    const timer = setTimeout(() => {
      scopeRef.current = createScope({
        root: containerRef.current,
        mediaQueries: { reduceMotion: '(prefers-reduced-motion)' }
      }).add(self => {
        if (self.matches.reduceMotion) {
          setAnimated(true)
          return
        }

        // Animate bars growing upward with stagger left-to-right
        animate('.recharts-bar-rectangle', {
          scaleY: [0, 1],
          opacity: [0, 1],
          delay: stagger(40, { from: 'first' }),
          duration: 700,
          ease: 'out(3)',
          onComplete: () => setAnimated(true)
        })

        // Fade in the age cliff annotation
        animate('.age-cliff-note', {
          opacity: [0, 1],
          y: [8, 0],
          delay: 600,
          duration: 500,
          ease: 'out(3)'
        })
      })
    }, 100)

    return () => {
      clearTimeout(timer)
      scopeRef.current?.revert()
    }
  }, [chartData, animated])

  if (chartData.length === 0) {
    return (
      <div className="h-[280px] md:h-[350px] flex items-center justify-center text-secondary text-sm">
        No age distribution data available.
      </div>
    )
  }

  // Find the max rate for annotation
  const maxRate = Math.max(...chartData.map(d => Math.max(d.male, d.female)))

  return (
    <div ref={containerRef}>
      <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: isMobile ? 5 : 10, left: isMobile ? -10 : 0, bottom: 0 }}
          barCategoryGap="15%"
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="ageGroup"
            tick={{ fontSize: isMobile ? 9 : 11, fontFamily: 'Lato', fill: '#9CA3AF' }}
            stroke="#E5E7EB"
          />
          <YAxis
            tick={{ fontSize: isMobile ? 9 : 11, fontFamily: 'Lato', fill: '#9CA3AF' }}
            stroke="#E5E7EB"
            width={isMobile ? 40 : 55}
            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
            label={isMobile ? undefined : {
              value: 'Rate per 100k',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fontSize: 10, fontFamily: 'Lato', fill: '#9CA3AF' }
            }}
          />
          <Tooltip content={<AgeTooltip />} />
          <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 11, fontFamily: 'Lato' }} />
          <Bar
            dataKey="male"
            name="Male"
            fill={MALE_COLOR}
            fillOpacity={0.85}
            radius={[3, 3, 0, 0]}
            isAnimationActive={!animated}
            animationDuration={800}
          />
          <Bar
            dataKey="female"
            name="Female"
            fill={FEMALE_COLOR}
            fillOpacity={0.85}
            radius={[3, 3, 0, 0]}
            isAnimationActive={!animated}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Age cliff annotation */}
      <div className="age-cliff-note flex items-center justify-center gap-2 mt-2 text-[10px] text-secondary/70">
        <span className="inline-block w-4 border-t border-dashed border-secondary/40" />
        <span>Risk increases <strong className="text-primary font-medium">{Math.round(maxRate / chartData[0].male)}×</strong> from ages 0–29 to {chartData[chartData.length - 1].ageGroup}</span>
        <span className="inline-block w-4 border-t border-dashed border-secondary/40" />
      </div>
    </div>
  )
}
