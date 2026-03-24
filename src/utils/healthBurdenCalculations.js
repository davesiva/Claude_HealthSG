import { diabetesRates, hypertensionRates, ageBandMapping } from '../data/disease-prevalence-rates'

// Compute % aged 65+
export function computeElderlyRatio(areaData) {
  const { ageGroups, population } = areaData
  if (!population.total) return 0
  const elderly = (ageGroups['65_69'] || 0) + (ageGroups['70_74'] || 0) +
    (ageGroups['75_79'] || 0) + (ageGroups['80_84'] || 0) +
    (ageGroups['85_89'] || 0) + (ageGroups['90andOver'] || 0)
  return elderly / population.total
}

// Compute estimated disease prevalence weighted by age distribution
export function computeEstimatedPrevalence(areaData, rates) {
  const { ageGroups, population } = areaData
  if (!population.total) return 0

  let weightedCases = 0
  let eligiblePop = 0

  for (const [band, count] of Object.entries(ageGroups)) {
    const rateKey = ageBandMapping[band]
    if (!rateKey || !rates[rateKey]) continue
    weightedCases += count * rates[rateKey]
    eligiblePop += count
  }

  return eligiblePop > 0 ? weightedCases / eligiblePop : 0
}

// Compute % with any functional difficulty (some + severe)
export function computeDifficultyRate(areaData) {
  const diff = areaData.difficulty
  if (!diff || !diff.totalAssessed) return null
  return (diff.someDifficulty + diff.severeOrUnable) / diff.totalAssessed
}

// Compute all metrics for all areas
export function getAllAreaMetrics(censusData) {
  const results = {}

  for (const [name, data] of Object.entries(censusData)) {
    results[name] = {
      population: data.population.total,
      elderlyRatio: computeElderlyRatio(data),
      estDiabetes: computeEstimatedPrevalence(data, diabetesRates),
      estHypertension: computeEstimatedPrevalence(data, hypertensionRates),
      difficultyRate: computeDifficultyRate(data),
      ageGroups: data.ageGroups,
    }
  }

  return results
}

// Metric definitions
export const METRICS = [
  {
    id: 'elderlyRatio',
    label: 'Elderly Ratio',
    unit: '% aged 65+',
    format: v => `${(v * 100).toFixed(1)}%`,
    colorScale: 'teal', // neutral/informational
  },
  {
    id: 'estDiabetes',
    label: 'Est. Diabetes',
    unit: 'estimated prevalence',
    format: v => `${(v * 100).toFixed(1)}%`,
    colorScale: 'warm', // concerning
  },
  {
    id: 'estHypertension',
    label: 'Est. Hypertension',
    unit: 'estimated prevalence',
    format: v => `${(v * 100).toFixed(1)}%`,
    colorScale: 'warm',
  },
  {
    id: 'difficultyRate',
    label: 'Functional Difficulty',
    unit: '% with difficulty',
    format: v => v != null ? `${(v * 100).toFixed(1)}%` : 'N/A',
    colorScale: 'warm',
  },
]

// Color scales
const SCALES = {
  teal: { low: '#E6FFFA', mid: '#5EEAD4', high: '#0F766E' },
  warm: { low: '#FEF3C7', mid: '#F59E0B', high: '#DC2626' },
}

function parseHex(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function lerpColor(a, b, t) {
  const [r1, g1, b1] = parseHex(a)
  const [r2, g2, b2] = parseHex(b)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const bl = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${bl})`
}

export function getColorScale(metricId, allValues) {
  const metric = METRICS.find(m => m.id === metricId)
  const colors = SCALES[metric?.colorScale || 'teal']
  const valid = allValues.filter(v => v != null && !isNaN(v))
  const min = Math.min(...valid)
  const max = Math.max(...valid)

  const scale = (value) => {
    if (value == null || isNaN(value)) return '#F3F4F6'
    const t = max > min ? (value - min) / (max - min) : 0
    if (t < 0.5) return lerpColor(colors.low, colors.mid, t * 2)
    return lerpColor(colors.mid, colors.high, (t - 0.5) * 2)
  }

  scale.noDataColor = '#F3F4F6'
  scale.min = min
  scale.max = max
  return scale
}
