import { useRef, useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { createScope, animate, stagger } from 'animejs'

const MALE_COLOR = '#3B82F6'
const FEMALE_COLOR = '#EC4899'

function ButterflyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-primary mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.value < 0 ? MALE_COLOR : FEMALE_COLOR }}>
          {p.value < 0 ? '♂ Male' : '♀ Female'}: {Math.abs(p.value).toFixed(1)}%
          {p.payload && (
            <span className="text-secondary ml-1">
              ({(p.value < 0 ? p.payload.maleCases : p.payload.femaleCases)?.toLocaleString()} cases)
            </span>
          )}
        </p>
      ))}
    </div>
  )
}

export default function CancerButterflyChart({ data, isMobile }) {
  const containerRef = useRef(null)
  const [animated, setAnimated] = useState(false)
  const scopeRef = useRef(null)

  // Merge male & female into butterfly data (male negative, female positive)
  const chartData = useMemo(() => {
    if (!data?.male || !data?.female) return []
    // Get unique cancer sites from both lists
    const allSites = new Set([
      ...data.male.map(d => d.site),
      ...data.female.map(d => d.site)
    ])
    // Build rows for each site
    return Array.from(allSites).map(site => {
      const male = data.male.find(d => d.site === site)
      const female = data.female.find(d => d.site === site)
      return {
        site: site.length > 14 ? site.slice(0, 12) + '…' : site,
        fullSite: site,
        male: male ? -male.pct : 0,
        female: female ? female.pct : 0,
        maleCases: male?.cases || 0,
        femaleCases: female?.cases || 0,
      }
    }).sort((a, b) => (Math.abs(b.male) + b.female) - (Math.abs(a.male) + a.female))
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

        // Animate the bars by scaling from center
        animate('.recharts-bar-rectangle', {
          scaleX: [0, 1],
          opacity: [0, 1],
          delay: stagger(60),
          duration: 600,
          ease: 'out(3)',
          onComplete: () => setAnimated(true)
        })

        // Animate legend / labels
        animate('.butterfly-legend', {
          opacity: [0, 1],
          y: [10, 0],
          delay: 400,
          duration: 500,
          ease: 'out(3)'
        })
      })
    }, 100) // small delay to let Recharts render

    return () => {
      clearTimeout(timer)
      scopeRef.current?.revert()
    }
  }, [chartData, animated])

  if (chartData.length === 0) {
    return (
      <div className="h-[280px] md:h-[350px] flex items-center justify-center text-secondary text-sm">
        No cancer breakdown data available.
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      {/* Legend */}
      <div className="butterfly-legend flex items-center justify-center gap-6 mb-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: MALE_COLOR }} />
          <span className="text-secondary">♂ Male</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: FEMALE_COLOR }} />
          <span className="text-secondary">♀ Female</span>
        </span>
      </div>

      <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: isMobile ? 10 : 30, left: isMobile ? 10 : 30, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: isMobile ? 9 : 11, fontFamily: 'Lato', fill: '#9CA3AF' }}
            stroke="#E5E7EB"
            tickFormatter={v => `${Math.abs(v)}%`}
            domain={[-35, 35]}
          />
          <YAxis
            type="category"
            dataKey="site"
            tick={{ fontSize: isMobile ? 9 : 11, fontFamily: 'Lato', fill: '#6B7280', fontWeight: 500 }}
            stroke="none"
            width={isMobile ? 75 : 110}
          />
          <Tooltip content={<ButterflyTooltip />} />
          <ReferenceLine x={0} stroke="#D1D5DB" strokeWidth={1.5} />
          <Bar dataKey="male" name="Male" radius={[4, 0, 0, 4]} isAnimationActive={!animated} animationDuration={800}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={MALE_COLOR} fillOpacity={0.85} />
            ))}
          </Bar>
          <Bar dataKey="female" name="Female" radius={[0, 4, 4, 0]} isAnimationActive={!animated} animationDuration={800}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={FEMALE_COLOR} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Case count summary */}
      <div className="butterfly-legend flex items-center justify-center gap-8 mt-2 text-[10px] text-secondary/60 font-mono">
        <span>♂ {data.male?.reduce((s, d) => s + d.cases, 0).toLocaleString()} total cases</span>
        <span>♀ {data.female?.reduce((s, d) => s + d.cases, 0).toLocaleString()} total cases</span>
      </div>
    </div>
  )
}
