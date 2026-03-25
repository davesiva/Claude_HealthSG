// Compute % aged 65+
export function computeElderlyRatio(areaData) {
  const { ageGroups, population } = areaData
  if (!population.total) return 0
  const elderly = (ageGroups['65_69'] || 0) + (ageGroups['70_74'] || 0) +
    (ageGroups['75_79'] || 0) + (ageGroups['80_84'] || 0) +
    (ageGroups['85_89'] || 0) + (ageGroups['90andOver'] || 0)
  return elderly / population.total
}

// Compute % aged 0-14
export function computeYouthRatio(areaData) {
  const { ageGroups, population } = areaData
  if (!population.total) return 0
  const youth = (ageGroups['0_4'] || 0) + (ageGroups['5_9'] || 0) + (ageGroups['10_14'] || 0)
  return youth / population.total
}

// Compute dependency ratio: (aged 0-14 + aged 65+) / (aged 15-64)
export function computeDependencyRatio(areaData) {
  const { ageGroups, population } = areaData
  if (!population.total) return 0
  const young = (ageGroups['0_4'] || 0) + (ageGroups['5_9'] || 0) + (ageGroups['10_14'] || 0)
  const elderly = (ageGroups['65_69'] || 0) + (ageGroups['70_74'] || 0) +
    (ageGroups['75_79'] || 0) + (ageGroups['80_84'] || 0) +
    (ageGroups['85_89'] || 0) + (ageGroups['90andOver'] || 0)
  const workingAge = population.total - young - elderly
  return workingAge > 0 ? (young + elderly) / workingAge : 0
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
      youthRatio: computeYouthRatio(data),
      dependencyRatio: computeDependencyRatio(data),
      difficultyRate: computeDifficultyRate(data),
      ageGroups: data.ageGroups,
    }
  }

  return results
}

// Metric definitions — only factually verifiable data from Census 2020
export const METRICS = [
  {
    id: 'elderlyRatio',
    label: 'Aged 65+',
    unit: '% aged 65+',
    tooltip: 'Percentage of residents aged 65 and above. Towns built in the 1970s–80s have aged in place, creating concentrated elderly populations.',
    format: v => `${(v * 100).toFixed(1)}%`,
    colorScale: 'teal',
  },
  {
    id: 'youthRatio',
    label: 'Under 15',
    unit: '% aged 0-14',
    tooltip: 'Percentage of residents aged 0–14. Newer towns like Punggol and Sengkang have the highest youth ratios, reflecting young families.',
    format: v => `${(v * 100).toFixed(1)}%`,
    colorScale: 'blue',
  },
  {
    id: 'dependencyRatio',
    label: 'Dependency Ratio',
    unit: 'dependents per worker',
    tooltip: 'Number of dependents (aged 0–14 and 65+) per working-age resident (15–64). Higher ratios mean more pressure on each working adult to support the young and old.',
    format: v => v.toFixed(2),
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

// Distinct color scales per metric
const SCALES = {
  teal:   { low: '#F0FDFA', high: '#115E59' },
  blue:   { low: '#EFF6FF', high: '#1E3A8A' },
  purple: { low: '#F5F3FF', high: '#5B21B6' },
  amber:  { low: '#FFFBEB', high: '#92400E' },
}

// CSS gradient strings for the legend bar
export const SCALE_GRADIENTS = {
  teal:   'linear-gradient(to right, #F0FDFA, #5EEAD4, #115E59)',
  blue:   'linear-gradient(to right, #EFF6FF, #60A5FA, #1E3A8A)',
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
  const valid = allValues.filter(v => v != null && !isNaN(v) && v > 0)
  const min = Math.min(...valid)
  const max = Math.max(...valid)

  const scale = (value) => {
    if (value == null || isNaN(value) || value === 0) return '#F3F4F6'
    const t = max > min ? (value - min) / (max - min) : 0
    return lerpColor(colors.low, colors.high, t)
  }

  scale.noDataColor = '#F3F4F6'
  scale.min = min
  scale.max = max
  scale.colorScale = metric?.colorScale || 'teal'
  return scale
}
