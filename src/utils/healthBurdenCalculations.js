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
    tooltip: 'Percentage of residents aged 65 and above. Areas with higher elderly ratios face greater demand for healthcare and social services.',
    format: v => `${(v * 100).toFixed(1)}%`,
    colorScale: 'teal',
  },
  {
    id: 'estDiabetes',
    label: 'Est. Diabetes',
    unit: 'estimated prevalence',
    tooltip: 'Estimated diabetes prevalence based on each area\'s age distribution applied to national age-specific rates (NPHS). Not a direct measurement.',
    format: v => `${(v * 100).toFixed(1)}%`,
    colorScale: 'rose',
  },
  {
    id: 'estHypertension',
    label: 'Est. Hypertension',
    unit: 'estimated prevalence',
    tooltip: 'Estimated hypertension prevalence based on each area\'s age distribution applied to national age-specific rates (NPHS). Not a direct measurement.',
    format: v => `${(v * 100).toFixed(1)}%`,
    colorScale: 'purple',
  },
  {
    id: 'difficultyRate',
    label: 'Functional Difficulty',
    unit: '% with difficulty',
    tooltip: 'Percentage of residents reporting some difficulty or inability to perform at least one basic activity (seeing, hearing, mobility, cognition). From Census 2020.',
    format: v => v != null ? `${(v * 100).toFixed(1)}%` : 'N/A',
    colorScale: 'amber',
  },
]

// Distinct color scales per metric for visual differentiation
const SCALES = {
  teal:   { low: '#F0FDFA', high: '#115E59' },  // elderly ratio — teal
  rose:   { low: '#FFF1F2', high: '#9F1239' },  // diabetes — rose/red
  purple: { low: '#F5F3FF', high: '#5B21B6' },  // hypertension — violet
  amber:  { low: '#FFFBEB', high: '#92400E' },  // difficulty — amber/brown
}

// CSS gradient strings for the legend bar
export const SCALE_GRADIENTS = {
  teal:   'linear-gradient(to right, #F0FDFA, #5EEAD4, #115E59)',
  rose:   'linear-gradient(to right, #FFF1F2, #FB7185, #9F1239)',
  purple: 'linear-gradient(to right, #F5F3FF, #A78BFA, #5B21B6)',
  amber:  'linear-gradient(to right, #FFFBEB, #FBBF24, #92400E)',
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
  // Filter out nulls, NaNs, and zeros (unpopulated areas)
  const valid = allValues.filter(v => v != null && !isNaN(v) && v > 0)
  const min = Math.min(...valid)
  const max = Math.max(...valid)

  const scale = (value) => {
    if (value == null || isNaN(value) || value === 0) return '#F3F4F6'
    // Map the actual data range [min, max] to [0, 1]
    const t = max > min ? (value - min) / (max - min) : 0
    return lerpColor(colors.low, colors.high, t)
  }

  scale.noDataColor = '#F3F4F6'
  scale.min = min
  scale.max = max
  scale.colorScale = metric?.colorScale || 'teal'
  return scale
}
