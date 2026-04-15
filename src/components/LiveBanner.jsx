import { useState, useEffect } from 'react'
import InfoTooltip from './InfoTooltip'

function getPM25Level(value) {
  if (value <= 55) return { label: 'Good', color: '#5370E0' }
  if (value <= 150) return { label: 'Moderate', color: '#F59E0B' }
  return { label: 'Unhealthy', color: '#EF4444' }
}

function getUVLevel(value) {
  if (value <= 2) return { label: 'Low', color: '#5370E0' }
  if (value <= 5) return { label: 'Moderate', color: '#F59E0B' }
  if (value <= 7) return { label: 'High', color: '#F59E0B' }
  if (value <= 10) return { label: 'Very High', color: '#EF4444' }
  return { label: 'Extreme', color: '#EF4444' }
}

export default function LiveBanner() {
  const [pm25, setPm25] = useState(null)
  const [uv, setUv] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [pm25Res, uvRes] = await Promise.all([
          fetch('https://api-open.data.gov.sg/v2/real-time/api/pm25'),
          fetch('https://api-open.data.gov.sg/v2/real-time/api/uv-index')
        ])

        const pm25Data = await pm25Res.json()
        const uvData = await uvRes.json()

        const readings = pm25Data?.data?.readings
        if (readings && readings.length > 0) {
          const lastReading = readings[readings.length - 1]
          const values = Object.values(lastReading || {})
          const numericValues = values.filter(v => typeof v === 'number')
          if (numericValues.length > 0) {
            const avg = Math.round(numericValues.reduce((a, b) => a + b, 0) / numericValues.length)
            setPm25(avg)
          }
        }

        const uvReadings = uvData?.data?.records
        if (uvReadings && uvReadings.length > 0) {
          const lastRecord = uvReadings[uvReadings.length - 1]
          const uvValue = lastRecord?.value ?? lastRecord?.index
          if (typeof uvValue === 'number') {
            setUv(uvValue)
          }
        }

        setVisible(true)
      } catch {
        setVisible(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (!visible || (pm25 === null && uv === null)) return null

  const pm25Level = pm25 !== null ? getPM25Level(pm25) : null
  const uvLevel = uv !== null ? getUVLevel(uv) : null

  return (
    <div className="w-full h-9 flex items-center justify-center gap-4 text-xs bg-grid/80 border-b border-border px-4">
      <span className="text-secondary">Right now:</span>
      {pm25Level && (
        <span className="font-mono text-xs">
          PM2.5{' '}
          <span className="font-semibold" style={{ color: pm25Level.color }}>
            {pm25} µg/m³
          </span>{' '}
          <span style={{ color: pm25Level.color }}>({pm25Level.label})</span>
          <InfoTooltip content="PM2.5 measures fine particulate matter in the air (µg/m³). Good: 0-55, Moderate: 56-150, Unhealthy: 151+. Averaged across Singapore monitoring stations. Updated every 5 min from NEA via data.gov.sg." size={11} />
        </span>
      )}
      {pm25Level && uvLevel && <span className="text-border">·</span>}
      {uvLevel && (
        <span className="font-mono text-xs">
          UV Index{' '}
          <span className="font-semibold" style={{ color: uvLevel.color }}>
            {uv}
          </span>{' '}
          <span style={{ color: uvLevel.color }}>({uvLevel.label})</span>
          <InfoTooltip content="UV Index measures solar ultraviolet radiation intensity. Low: 0-2, Moderate: 3-5, High: 6-7, Very High: 8-10, Extreme: 11+. Apply sunscreen when UV ≥ 3. Live from NEA via data.gov.sg." size={11} />
        </span>
      )}
    </div>
  )
}
