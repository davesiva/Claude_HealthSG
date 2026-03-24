/**
 * Compute key statistics for the Data Brief card.
 * Each comparison can define a `dataBrief.stats` array in its config.
 * Each stat descriptor tells us what to compute from the resolved data.
 *
 * Stat types:
 *   - change: % or absolute change between first and last data point
 *   - latest: most recent value
 *   - ratio: ratio between two series at a given point
 *   - custom: pre-computed value from config (for non-time-series charts)
 */

import { resolveSeriesData } from './insightLabDataResolver'

function fmt(value, format) {
  if (format === '%') return `${Math.abs(value).toFixed(1)}%`
  if (format === 'x') return `${value.toFixed(1)}×`
  if (format === '$') return `S$${value.toFixed(1)}B`
  if (format === 'int') return Math.round(value).toLocaleString()
  if (format === '/100k') return `${Math.round(value)}/100k`
  if (format === 'dec') return value.toFixed(2)
  return typeof value === 'number'
    ? (value < 10 ? value.toFixed(1) : Math.round(value).toLocaleString())
    : String(value)
}

function arrow(value) {
  if (value > 0) return '↑'
  if (value < 0) return '↓'
  return '→'
}

export function computeDataBriefStats(healthData, comparison) {
  const briefConfig = comparison.dataBrief
  if (!briefConfig?.stats) return null

  const results = []

  for (const stat of briefConfig.stats) {
    try {
      if (stat.type === 'custom') {
        results.push({
          value: stat.value,
          label: stat.label,
          direction: stat.direction || 'neutral'
        })
        continue
      }

      if (stat.type === 'change') {
        const series = resolveSeriesData(healthData, stat.dataPath, comparison.yearRange || [1900, 2100])
        if (series.length < 2) continue
        const first = series[0]
        const last = series[series.length - 1]

        if (stat.mode === 'absolute') {
          const diff = last.value - first.value
          const prefix = diff > 0 ? '+' : ''
          results.push({
            value: `${prefix}${fmt(diff, stat.format)}`,
            label: stat.label,
            sublabel: `${first.year}–${last.year}`,
            direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
          })
        } else {
          // percentage change
          const pctChange = ((last.value - first.value) / first.value) * 100
          results.push({
            value: `${arrow(pctChange)} ${fmt(pctChange, '%')}`,
            label: stat.label,
            sublabel: `${first.year}–${last.year}`,
            direction: pctChange > 0 ? 'up' : pctChange < 0 ? 'down' : 'neutral'
          })
        }
        continue
      }

      if (stat.type === 'latest') {
        const series = resolveSeriesData(healthData, stat.dataPath, comparison.yearRange || [1900, 2100])
        if (!series.length) continue
        const last = series[series.length - 1]
        results.push({
          value: fmt(last.value, stat.format),
          label: stat.label,
          sublabel: `${last.year}`,
          direction: stat.direction || 'neutral'
        })
        continue
      }

      if (stat.type === 'ratio') {
        const seriesA = resolveSeriesData(healthData, stat.dataPathA, comparison.yearRange || [1900, 2100])
        const seriesB = resolveSeriesData(healthData, stat.dataPathB, comparison.yearRange || [1900, 2100])
        if (!seriesA.length || !seriesB.length) continue
        const lastA = seriesA[seriesA.length - 1]
        const lastB = seriesB[seriesB.length - 1]
        const ratio = lastA.value / lastB.value
        results.push({
          value: fmt(ratio, stat.format || 'x'),
          label: stat.label,
          sublabel: `${lastA.year}`,
          direction: stat.direction || 'neutral'
        })
        continue
      }

      if (stat.type === 'sparkline') {
        const series = resolveSeriesData(healthData, stat.dataPath, comparison.yearRange || [1900, 2100])
        if (series.length < 2) continue
        const first = series[0]
        const last = series[series.length - 1]
        const pctChange = ((last.value - first.value) / first.value) * 100
        results.push({
          value: `${arrow(pctChange)} ${fmt(pctChange, '%')}`,
          label: stat.label,
          sublabel: `${first.year}–${last.year}`,
          direction: pctChange > 0 ? 'up' : pctChange < 0 ? 'down' : 'neutral',
          sparkData: series.map(d => d.value)
        })
        continue
      }
    } catch {
      // skip broken stat
    }
  }

  return results.length ? results : null
}

/**
 * Tiny SVG sparkline for inline use in stat pills.
 * Takes an array of numbers, renders a 60×20 path.
 */
export function Sparkline({ data, color = '#6366F1', width = 60, height = 20 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)

  const points = data.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * (height - 2) - 1
    return `${x},${y}`
  })

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block ml-1.5 opacity-60">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
