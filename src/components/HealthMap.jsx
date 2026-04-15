import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, Tooltip as RechartsTooltip } from 'recharts'
import { MapPin, TrendingUp, Users, Loader2 } from 'lucide-react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import InfoTooltip from './InfoTooltip'
import { censusData, nationalTotals } from '../data/planning-area-census'
import geoData from '../data/planning-area-boundaries.json'
import { getAllAreaMetrics, getColorScale, METRICS, SCALE_GRADIENTS } from '../utils/healthBurdenCalculations'
import { fetchAgingTrend } from '../utils/fetchOneMapData'

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768

// Singapore bounds for the map view
const SG_CENTER = [1.35, 103.82]
const SG_BOUNDS = [[1.15, 103.59], [1.48, 104.10]]

export default function HealthMap() {
  const [sectionRef, isVisible] = useScrollAnimation(0.1)
  const [activeMetric, setActiveMetric] = useState('elderlyRatio')
  const [selectedArea, setSelectedArea] = useState(null)
  const [agingTrend, setAgingTrend] = useState(null)
  const [trendLoading, setTrendLoading] = useState(false)
  const [mobile, setMobile] = useState(isMobile())

  useEffect(() => {
    const handleResize = () => setMobile(isMobile())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Compute all metrics once
  const areaMetrics = useMemo(() => getAllAreaMetrics(censusData), [])
  const nationalMetrics = useMemo(() => getAllAreaMetrics({ NATIONAL: nationalTotals }).NATIONAL, [])

  // Color scale for current metric
  const colorScale = useMemo(() => {
    const values = Object.values(areaMetrics).map(m => m[activeMetric])
    return getColorScale(activeMetric, values)
  }, [areaMetrics, activeMetric])

  const currentMetricDef = METRICS.find(m => m.id === activeMetric)

  // Fetch aging trend when area is selected
  useEffect(() => {
    if (!selectedArea) {
      setAgingTrend(null)
      return
    }
    let cancelled = false
    setTrendLoading(true)
    fetchAgingTrend(selectedArea).then(data => {
      if (!cancelled) {
        setAgingTrend(data.length > 0 ? data : null)
        setTrendLoading(false)
      }
    }).catch(() => {
      if (!cancelled) {
        setAgingTrend(null)
        setTrendLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [selectedArea])

  // Use ref so Leaflet event handlers always get the latest callback
  const handleAreaClickRef = useRef(null)
  handleAreaClickRef.current = (name) => {
    setSelectedArea(prev => prev === name ? null : name)
  }

  const formatAreaName = (name) =>
    name.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
      .replace(/-./g, m => '-' + m[1].toUpperCase())

  // Style each GeoJSON feature
  const styleFeature = useCallback((feature) => {
    const name = feature.properties.name
    const metrics = areaMetrics[name]
    const value = metrics ? metrics[activeMetric] : null
    const isSelected = selectedArea === name
    const fill = value != null && !isNaN(value)
      ? colorScale(value)
      : '#F3F4F6'

    return {
      fillColor: fill,
      fillOpacity: 0.85,
      color: isSelected ? '#5370E0' : '#FFFFFF',
      weight: isSelected ? 3 : 1,
      opacity: 1,
    }
  }, [areaMetrics, activeMetric, colorScale, selectedArea])

  // Bind events to each feature
  const onEachFeature = useCallback((feature, layer) => {
    const name = feature.properties.name
    const metrics = areaMetrics[name]
    if (!metrics) return

    // Tooltip on hover
    const tooltipContent = `<div style="font-family: 'Lato', sans-serif; font-size: 12px;">
      <strong>${formatAreaName(name)}</strong><br/>
      <span style="font-family: 'Roboto Mono', monospace; color: #6B7280;">
        ${currentMetricDef.label}: ${currentMetricDef.format(metrics[activeMetric])}
      </span>
    </div>`

    layer.bindTooltip(tooltipContent, {
      sticky: true,
      direction: 'top',
      offset: [0, -10],
      className: 'health-map-tooltip',
    })

    layer.on({
      mouseover: (e) => {
        e.target.setStyle({ weight: 2, color: '#5370E0', fillOpacity: 0.95 })
        e.target.bringToFront()
      },
      mouseout: (e) => {
        e.target.setStyle(styleFeature(feature))
      },
      click: () => handleAreaClickRef.current?.(name),
    })
  }, [areaMetrics, activeMetric, currentMetricDef, styleFeature, formatAreaName])

  // Age distribution chart data for detail panel
  const ageDistData = useMemo(() => {
    if (!selectedArea || !areaMetrics[selectedArea]) return null
    const area = areaMetrics[selectedArea].ageGroups
    const nat = nationalTotals.ageGroups
    const natTotal = nationalTotals.population.total
    const areaTotal = areaMetrics[selectedArea].population

    const bands = [
      { label: '0-14', keys: ['0_4', '5_9', '10_14'] },
      { label: '15-24', keys: ['15_19', '20_24'] },
      { label: '25-44', keys: ['25_29', '30_34', '35_39', '40_44'] },
      { label: '45-64', keys: ['45_49', '50_54', '55_59', '60_64'] },
      { label: '65+', keys: ['65_69', '70_74', '75_79', '80_84', '85_89', '90andOver'] },
    ]

    return bands.map(b => {
      const areaPop = b.keys.reduce((s, k) => s + (area[k] || 0), 0)
      const natPop = b.keys.reduce((s, k) => s + (nat[k] || 0), 0)
      return {
        label: b.label,
        area: areaTotal > 0 ? (areaPop / areaTotal * 100) : 0,
        national: natTotal > 0 ? (natPop / natTotal * 100) : 0,
      }
    })
  }, [selectedArea, areaMetrics])

  return (
    <section id="health-map" className="py-20 md:py-30 px-4 md:px-6">
      <div className="max-w-[960px] mx-auto">
        {/* Header */}
        <motion.h2
          ref={sectionRef}
          className="font-heading text-3xl md:text-4xl text-primary text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          Health Across the Island
          <InfoTooltip content="Health indicators across Singapore's planning areas, estimated from Census 2020 age distributions and national prevalence rates (NPHS). These reflect demographic composition, not direct health measurements." />
        </motion.h2>

        <motion.p
          className="text-center text-secondary text-sm mt-3 max-w-lg mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Tap any area on the map to explore its health profile.
        </motion.p>

        {/* Metric pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {METRICS.map(metric => (
            <span key={metric.id} className="inline-flex items-center">
              <button
                onClick={() => setActiveMetric(metric.id)}
                className={`px-4 py-2 rounded-full text-sm font-body transition-all cursor-pointer focus:outline-none ${
                  activeMetric === metric.id
                    ? 'text-white shadow-sm'
                    : 'bg-card text-secondary border border-border hover:border-accent'
                }`}
                style={{
                  backgroundColor: activeMetric === metric.id ? '#5370E0' : undefined,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {metric.label}
              </button>
              <InfoTooltip content={metric.tooltip} size={12} />
            </span>
          ))}
        </motion.div>

        {/* Map */}
        <motion.div
          className="mt-8 card p-0 overflow-hidden rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div style={{ height: mobile ? 350 : 420 }}>
            <MapContainer
              center={SG_CENTER}
              zoom={11}
              minZoom={11}
              maxZoom={14}
              maxBounds={SG_BOUNDS}
              maxBoundsViscosity={1.0}
              zoomControl={false}
              attributionControl={false}
              style={{ height: '100%', width: '100%', background: '#FAFAF8' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                opacity={0.3}
              />
              <GeoJSON
                key={activeMetric}
                data={geoData}
                style={styleFeature}
                onEachFeature={onEachFeature}
              />
            </MapContainer>
          </div>

          {/* Color scale legend */}
          <div className="flex items-center gap-2 py-3 px-4 justify-center border-t border-border">
            <span className="text-[10px] font-mono text-secondary/60">
              {currentMetricDef.format(colorScale.min)}
            </span>
            <div
              className="h-2.5 rounded-full flex-1 max-w-[200px]"
              style={{
                background: SCALE_GRADIENTS[colorScale.colorScale] || SCALE_GRADIENTS.teal,
              }}
            />
            <span className="text-[10px] font-mono text-secondary/60">
              {currentMetricDef.format(colorScale.max)}
            </span>
          </div>
        </motion.div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {selectedArea && areaMetrics[selectedArea] && (
            <motion.div
              key={selectedArea}
              className="mt-4 card p-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Area header */}
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={16} className="text-accent" />
                <h3 className="font-heading text-xl md:text-2xl text-primary">
                  {formatAreaName(selectedArea)}
                </h3>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <StatCard
                  label="Population"
                  value={areaMetrics[selectedArea].population.toLocaleString()}
                  icon={<Users size={13} className="text-secondary/40" />}
                />
                <StatCard
                  label="Aged 65+"
                  value={`${(areaMetrics[selectedArea].elderlyRatio * 100).toFixed(1)}%`}
                  national={`${(nationalMetrics.elderlyRatio * 100).toFixed(1)}%`}
                  highlight={areaMetrics[selectedArea].elderlyRatio > nationalMetrics.elderlyRatio}
                />
                <StatCard
                  label="Under 15"
                  value={`${(areaMetrics[selectedArea].youthRatio * 100).toFixed(1)}%`}
                  national={`${(nationalMetrics.youthRatio * 100).toFixed(1)}%`}
                />
                <StatCard
                  label="Dependency Ratio"
                  value={areaMetrics[selectedArea].dependencyRatio.toFixed(2)}
                  national={nationalMetrics.dependencyRatio.toFixed(2)}
                  highlight={areaMetrics[selectedArea].dependencyRatio > nationalMetrics.dependencyRatio}
                />
                <StatCard
                  label="Functional Diff."
                  value={areaMetrics[selectedArea].difficultyRate != null
                    ? `${(areaMetrics[selectedArea].difficultyRate * 100).toFixed(1)}%`
                    : 'N/A'}
                  national={nationalMetrics.difficultyRate != null
                    ? `${(nationalMetrics.difficultyRate * 100).toFixed(1)}%`
                    : null}
                  highlight={areaMetrics[selectedArea].difficultyRate != null &&
                    nationalMetrics.difficultyRate != null &&
                    areaMetrics[selectedArea].difficultyRate > nationalMetrics.difficultyRate}
                />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Age distribution comparison */}
                <div>
                  <h4 className="text-sm font-body font-semibold text-primary mb-3">
                    Age Distribution vs National
                  </h4>
                  {ageDistData && (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={ageDistData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'Roboto Mono', fill: '#6B7280' }} stroke="#D1D5DB" />
                        <YAxis tick={{ fontSize: 10, fontFamily: 'Roboto Mono', fill: '#6B7280' }} stroke="#D1D5DB" width={35} />
                        <RechartsTooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="bg-white px-3 py-2 text-xs border border-border rounded-lg shadow-md">
                                <p className="font-mono font-semibold text-primary">{label}</p>
                                {payload.map((p, i) => (
                                  <p key={i} style={{ color: p.color }} className="font-mono">
                                    {p.name}: {p.value.toFixed(1)}%
                                  </p>
                                ))}
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="area" name={formatAreaName(selectedArea)} fill="#5370E0" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="national" name="National" fill="#D1D5DB" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Aging trend */}
                <div>
                  <h4 className="text-sm font-body font-semibold text-primary mb-3 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-accent" />
                    Aging Trend (2000–2020)
                  </h4>
                  {trendLoading ? (
                    <div className="h-[180px] flex items-center justify-center">
                      <Loader2 size={20} className="animate-spin text-secondary/40" />
                    </div>
                  ) : agingTrend ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={agingTrend} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fontFamily: 'Roboto Mono', fill: '#6B7280' }} stroke="#D1D5DB" />
                        <YAxis
                          tick={{ fontSize: 10, fontFamily: 'Roboto Mono', fill: '#6B7280' }}
                          stroke="#D1D5DB"
                          width={35}
                          tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                        />
                        <RechartsTooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="bg-white px-3 py-2 text-xs border border-border rounded-lg shadow-md">
                                <p className="font-mono font-semibold text-primary">{label}</p>
                                <p className="font-mono text-accent">
                                  Aged 65+: {(payload[0].value * 100).toFixed(1)}%
                                </p>
                              </div>
                            )
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="elderlyRatio"
                          stroke="#5370E0"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#5370E0', stroke: '#fff', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: '#5370E0', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-xs text-secondary/50 font-body">
                      Trend data unavailable for this area
                    </div>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 text-[10px] font-mono text-secondary/50">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-accent inline-block" /> {formatAreaName(selectedArea)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#D1D5DB] inline-block" /> National average
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Methodology note */}
        <motion.p
          className="text-xs text-secondary/40 italic mt-6 text-center max-w-lg mx-auto"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          All data from the Census of Population 2020, Department of Statistics Singapore.
        </motion.p>
      </div>
    </section>
  )
}

function StatCard({ label, value, national, icon, highlight }) {
  return (
    <div className="p-3 rounded-xl bg-grid/50">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[10px] text-secondary font-body truncate">{label}</span>
      </div>
      <p className={`text-lg md:text-xl font-mono font-semibold mt-1 ${highlight ? 'text-danger' : 'text-primary'}`}>
        {value}
      </p>
      {national && (
        <p className="text-[10px] font-mono text-secondary/50 mt-0.5">
          Nat: {national}
        </p>
      )}
    </div>
  )
}
