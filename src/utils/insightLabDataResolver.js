/**
 * Resolve a dot-notation data path into a time series from healthData.
 * Examples:
 *   'household_income.gini' → healthData.household_income.gini.data
 *   'diabetes_prevalence' → healthData.diabetes_prevalence.data
 *   'childhood_obesity' → healthData.childhood_obesity.data
 */
export function resolveSeriesData(healthData, dataPath, yearRange) {
  const parts = dataPath.split('.')
  let current = healthData

  for (const part of parts) {
    if (!current || typeof current !== 'object') return []
    current = current[part]
  }

  // current should now be an object with a .data array
  const data = current?.data || current
  if (!Array.isArray(data)) return []

  const [minYear, maxYear] = yearRange
  return data
    .filter(d => d.year >= minYear && d.year <= maxYear && d.value !== null)
    .sort((a, b) => a.year - b.year)
}

/**
 * Build merged chart data from a comparison config.
 * Returns [{ year, seriesId1: value, seriesId2: value, ... }]
 * Each series is keyed by its index (s0, s1, s2...) for Recharts.
 */
export function buildChartData(healthData, comparison) {
  const yearMap = new Map()

  comparison.series.forEach((s, i) => {
    const key = `s${i}`
    const data = resolveSeriesData(healthData, s.dataPath, comparison.yearRange)
    for (const d of data) {
      if (!yearMap.has(d.year)) yearMap.set(d.year, { year: d.year })
      yearMap.get(d.year)[key] = d.value
    }
  })

  return [...yearMap.values()].sort((a, b) => a.year - b.year)
}
