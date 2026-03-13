import fallbackData from '../data/health-indicators.json'

const API_BASE = 'https://data.gov.sg/api/action/datastore_search'
const RESOURCE_PREVALENCE = 'd_efea9966c502767122171c61d88062db'
const RESOURCE_DEMOGRAPHICS = 'd_711586488b23182801c94bd7b6807833'

function parseNum(val) {
  if (val === 'na' || val === null || val === undefined || val === '') return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

/**
 * Fetch overall disease prevalence (1992–2017) from Endpoint 1
 * Returns: { disease_name: [{ year, value }] }
 */
async function fetchPrevalence() {
  const res = await fetch(`${API_BASE}?resource_id=${RESOURCE_PREVALENCE}&limit=500`)
  const json = await res.json()
  const records = json.result?.records || []

  const grouped = {}
  for (const r of records) {
    const disease = r.disease?.trim()
    const year = parseNum(r.year)
    const value = parseNum(r.prevalence_rate)
    if (!disease || year === null) continue

    if (!grouped[disease]) grouped[disease] = []
    if (value !== null) {
      grouped[disease].push({ year, value })
    }
  }

  // Sort each by year
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.year - b.year)
  }

  return grouped
}

/**
 * Fetch demographics data (2007–2023) from Endpoint 2
 * Returns: { indicator: { total: [...], male: [...], female: [...] } }
 */
async function fetchDemographics() {
  const res = await fetch(`${API_BASE}?resource_id=${RESOURCE_DEMOGRAPHICS}&limit=500`)
  const json = await res.json()
  const records = json.result?.records || []

  const yearCols = ['2007', '2010', '2013', '2017', '2019', '2020', '2021', '2022', '2023']

  const result = {}
  for (const r of records) {
    const series = r.DataSeries?.trim()
    if (!series) continue

    // Determine indicator and demographic
    let indicator = series
    let demographic = 'total'

    if (series.startsWith('Male - ')) {
      indicator = series.replace('Male - ', '')
      demographic = 'male'
    } else if (series.startsWith('Female - ')) {
      indicator = series.replace('Female - ', '')
      demographic = 'female'
    } else if (series.startsWith('Total - ')) {
      indicator = series.replace('Total - ', '')
      demographic = 'total'
    }

    // Normalize indicator name
    indicator = indicator.trim()

    if (!result[indicator]) result[indicator] = {}
    if (!result[indicator][demographic]) result[indicator][demographic] = []

    for (const yr of yearCols) {
      const value = parseNum(r[yr])
      if (value !== null) {
        result[indicator][demographic].push({ year: parseInt(yr), value })
      }
    }

    result[indicator][demographic].sort((a, b) => a.year - b.year)
  }

  return result
}

// Map API indicator names to our internal keys
const PREVALENCE_MAP = {
  'Hypertension': 'hypertension_prevalence',
  'Diabetes': 'diabetes_prevalence',
  'Hyperlipidaemia': 'high_cholesterol_prevalence',
  'Obesity': 'obesity_prevalence',
  'Daily Smoking': 'daily_smoking_rate'
}

const DEMOGRAPHICS_MAP = {
  'Hypertension': 'hypertension_prevalence',
  'Diabetes Mellitus': 'diabetes_prevalence',
  'Hyperlipidaemia': 'high_cholesterol_prevalence',
  'Obese': 'obesity_prevalence',
  'Daily Smoking': 'daily_smoking_rate',
  'Overweight (Excluding Obese)': 'overweight_prevalence',
  'Sufficient Total Physical Activity': 'physical_activity',
  'Binge Drinking': 'binge_drinking',
  'Proportion of Singapore Residents Who Were Screened For Chronic Diseases According To The Recommended Frequency': 'chronic_disease_screening'
}

/**
 * Merge API data with fallback, producing the complete health indicators object.
 * Priority: API data > fallback data
 */
function mergeData(prevalence, demographics) {
  const merged = JSON.parse(JSON.stringify(fallbackData))

  // Update with Endpoint 1 (historical prevalence 1992-2017)
  for (const [apiName, key] of Object.entries(PREVALENCE_MAP)) {
    if (prevalence[apiName] && merged[key]) {
      // Merge: use API data for matching years, keep fallback for years not in API
      const apiYears = new Set(prevalence[apiName].map(d => d.year))
      const fallbackOnly = merged[key].data.filter(d => !apiYears.has(d.year))
      merged[key].data = [...prevalence[apiName], ...fallbackOnly].sort((a, b) => a.year - b.year)
      merged[key]._apiSource = 'data.gov.sg (Endpoint 1)'
    }
  }

  // Update with Endpoint 2 (demographics 2007-2023, more recent)
  for (const [apiName, key] of Object.entries(DEMOGRAPHICS_MAP)) {
    const demoData = demographics[apiName]
    if (!demoData) continue

    if (!merged[key]) {
      // New indicator not in fallback
      merged[key] = {
        label: apiName,
        unit: '%',
        source: 'MOH NPHS via data.gov.sg',
        data: [],
        _apiSource: 'data.gov.sg (Endpoint 2)'
      }
    }

    // Total data: merge with existing, preferring API for overlapping years
    if (demoData.total?.length) {
      const apiYears = new Set(demoData.total.map(d => d.year))
      const existing = merged[key].data.filter(d => !apiYears.has(d.year))
      merged[key].data = [...existing, ...demoData.total].sort((a, b) => a.year - b.year)
      merged[key]._apiSource = 'data.gov.sg (Endpoint 2)'
    }

    // Gender breakdown
    if (demoData.male?.length || demoData.female?.length) {
      merged[key].by_gender = {
        ...(demoData.male?.length ? { male: demoData.male } : {}),
        ...(demoData.female?.length ? { female: demoData.female } : {})
      }
    }
  }

  // Remove duplicate years (keep latest value for each year)
  for (const key of Object.keys(merged)) {
    if (merged[key].data) {
      const seen = new Map()
      for (const d of merged[key].data) {
        seen.set(d.year, d.value)
      }
      merged[key].data = [...seen.entries()]
        .map(([year, value]) => ({ year, value }))
        .sort((a, b) => a.year - b.year)
    }
  }

  return merged
}

/**
 * Main function: fetch all data, merge with fallback, return complete dataset.
 * Falls back gracefully to static data if APIs fail.
 */
export async function fetchAllHealthData() {
  try {
    const [prevalence, demographics] = await Promise.all([
      fetchPrevalence().catch(() => ({})),
      fetchDemographics().catch(() => ({}))
    ])

    const merged = mergeData(prevalence, demographics)
    merged._lastFetched = new Date().toISOString()
    merged._sources = {
      prevalence: Object.keys(prevalence).length > 0 ? 'live' : 'fallback',
      demographics: Object.keys(demographics).length > 0 ? 'live' : 'fallback',
      expenditure: 'fallback (API unpublished)'
    }

    return merged
  } catch {
    return {
      ...fallbackData,
      _lastFetched: null,
      _sources: { prevalence: 'fallback', demographics: 'fallback', expenditure: 'fallback' }
    }
  }
}
