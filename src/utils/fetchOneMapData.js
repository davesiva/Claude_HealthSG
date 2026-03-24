const YEARS = [2000, 2010, 2015, 2020]

// Fetch population age group data for a planning area across all available years
export async function fetchAgingTrend(planningArea) {
  const results = []

  for (const year of YEARS) {
    try {
      const res = await fetch(
        `/api/onemap/population?planningArea=${encodeURIComponent(planningArea)}&year=${year}`
      )
      if (!res.ok) continue

      const data = await res.json()
      // OneMap returns an array of records
      const records = Array.isArray(data) ? data : data.Result || data.result || []
      if (!records.length) continue

      // Sum up population counts from age group records
      let total = 0
      let elderly = 0
      for (const rec of records) {
        const pop = parseInt(rec.population || rec.pop || 0, 10)
        const ag = (rec.age_group || rec.ageGroup || '').toLowerCase()
        total += pop
        // Age groups 65+ in OneMap format
        if (ag.includes('65') || ag.includes('70') || ag.includes('75') ||
            ag.includes('80') || ag.includes('85') || ag.includes('90') ||
            ag.includes('95') || ag.includes('100')) {
          elderly += pop
        }
      }

      if (total > 0) {
        results.push({
          year,
          elderlyRatio: elderly / total,
          total,
          elderly,
        })
      }
    } catch {
      // Skip failed years
    }
  }

  return results
}
