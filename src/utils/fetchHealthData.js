import fallbackData from '../data/health-indicators.json'

const SINGSTAT_API = 'https://tablebuilder.singstat.gov.sg/api/table/tabledata'

// SingStat table IDs for each data category
const SINGSTAT_TABLES = {
  lifeExpectancy: 'M810501',
  chronicDisease: 'M870401',
  healthExpenditure: 'M870391',
  healthPersonnel: 'M870001',
  hospitalBeds: 'M870301',
  childhoodObesity: 'M870381',
  deathsByCause: 'M810131',
  hospitalOutpatient: 'M870311',
  infectiousDisease: 'M870361',
  populationByAge: 'M810011',
  populationIndicators: 'M810001',
  fertilityRates: 'M810091'
}

function parseNum(val) {
  if (val === 'na' || val === null || val === undefined || val === '' || val === 'n.a.') return null
  const cleaned = String(val).replace(/,/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

/**
 * Fetch a SingStat table. Returns raw rows array.
 * Uses server proxy in production, direct in dev.
 */
async function fetchSingStat(tableId) {
  const url = `/api/singstat/${tableId}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`SingStat ${tableId}: ${res.status}`)
  const json = await res.json()
  return json.Data?.row || json.row || []
}

/**
 * Parse SingStat row data into { seriesName: [{year, value}] }
 */
function parseRows(rows) {
  const result = {}
  for (const row of rows) {
    const series = row.rowText?.trim()
    if (!series) continue
    const points = []
    for (const col of row.columns || []) {
      const year = parseInt(col.key)
      const value = parseNum(col.value)
      if (!isNaN(year) && value !== null) {
        points.push({ year, value })
      }
    }
    if (points.length > 0) {
      result[series] = points.sort((a, b) => a.year - b.year)
    }
  }
  return result
}

/**
 * Update life expectancy from SingStat M810501
 */
function updateLifeExpectancy(merged, parsed) {
  const total = parsed['Total Life Expectancy At Birth (Residents)']
  const male = parsed['Male Life Expectancy At Birth (Residents)']
  const female = parsed['Female Life Expectancy At Birth (Residents)']

  if (total?.length) {
    merged.life_expectancy.data = mergeTimeSeries(merged.life_expectancy.data, total)
    merged.life_expectancy._live = true
  }
  if (male?.length || female?.length) {
    merged.life_expectancy.by_gender = {
      ...(male?.length ? { male } : merged.life_expectancy.by_gender?.male ? { male: merged.life_expectancy.by_gender.male } : {}),
      ...(female?.length ? { female } : merged.life_expectancy.by_gender?.female ? { female: merged.life_expectancy.by_gender.female } : {})
    }
  }
}

/**
 * Update chronic disease data from SingStat M870401
 */
function updateChronicDisease(merged, parsed) {
  const mapping = {
    'Diabetes Mellitus - Total': { key: 'diabetes_prevalence', demo: 'total' },
    'Diabetes Mellitus - Male': { key: 'diabetes_prevalence', demo: 'male' },
    'Diabetes Mellitus - Female': { key: 'diabetes_prevalence', demo: 'female' },
    'Hypertension - Total': { key: 'hypertension_prevalence', demo: 'total' },
    'Hypertension - Male': { key: 'hypertension_prevalence', demo: 'male' },
    'Hypertension - Female': { key: 'hypertension_prevalence', demo: 'female' },
    'Obese - Total': { key: 'obesity_prevalence', demo: 'total' },
    'Obese - Male': { key: 'obesity_prevalence', demo: 'male' },
    'Obese - Female': { key: 'obesity_prevalence', demo: 'female' },
    'Hyperlipidaemia - Total': { key: 'high_cholesterol_prevalence', demo: 'total' },
    'Hyperlipidaemia - Male': { key: 'high_cholesterol_prevalence', demo: 'male' },
    'Hyperlipidaemia - Female': { key: 'high_cholesterol_prevalence', demo: 'female' },
    'Daily Smoking - Total': { key: 'daily_smoking_rate', demo: 'total' },
    'Daily Smoking - Male': { key: 'daily_smoking_rate', demo: 'male' },
    'Daily Smoking - Female': { key: 'daily_smoking_rate', demo: 'female' },
    'Sufficient Total Physical Activity - Total': { key: 'physical_activity', demo: 'total' },
    'Sufficient Total Physical Activity - Male': { key: 'physical_activity', demo: 'male' },
    'Sufficient Total Physical Activity - Female': { key: 'physical_activity', demo: 'female' },
    'Binge Drinking - Total': { key: 'binge_drinking', demo: 'total' },
    'Binge Drinking - Male': { key: 'binge_drinking', demo: 'male' },
    'Binge Drinking - Female': { key: 'binge_drinking', demo: 'female' },
    'Proportion Of Singapore Residents Who Were Screened For Chronic Diseases According To The Recommended Frequency - Total': { key: 'chronic_disease_screening', demo: 'total' },
    'Proportion Of Singapore Residents Who Were Screened For Chronic Diseases According To The Recommended Frequency - Male': { key: 'chronic_disease_screening', demo: 'male' },
    'Proportion Of Singapore Residents Who Were Screened For Chronic Diseases According To The Recommended Frequency - Female': { key: 'chronic_disease_screening', demo: 'female' }
  }

  for (const [seriesName, { key, demo }] of Object.entries(mapping)) {
    const data = parsed[seriesName]
    if (!data?.length || !merged[key]) continue

    if (demo === 'total') {
      merged[key].data = mergeTimeSeries(merged[key].data, data)
      merged[key]._live = true
    } else {
      if (!merged[key].by_gender) merged[key].by_gender = {}
      merged[key].by_gender[demo] = data
    }
  }
}

/**
 * Update health expenditure from SingStat M870391
 */
function updateHealthExpenditure(merged, parsed) {
  const total = parsed['Government Health Expenditure']
  if (total?.length) {
    // Convert from millions to billions
    const converted = total.map(d => ({ year: d.year, value: Math.round(d.value / 100) / 10 }))
    merged.govt_health_expenditure.data = mergeTimeSeries(merged.govt_health_expenditure.data, converted)
    merged.govt_health_expenditure._live = true
  }
}

/**
 * Update health personnel from SingStat M870001
 */
function updateHealthPersonnel(merged, parsed) {
  const doctors = parsed['Doctors Per 10,000 Total Population']
  if (doctors?.length) {
    merged.health_personnel.data = mergeTimeSeries(merged.health_personnel.data, doctors)
    merged.health_personnel._live = true
  }
}

/**
 * Update childhood obesity from SingStat M870381
 */
function updateChildhoodObesity(merged, parsed) {
  const data = parsed['Overweight And Severely Overweight Primary One Children']
  if (data?.length) {
    merged.childhood_obesity.data = mergeTimeSeries(merged.childhood_obesity.data, data)
    merged.childhood_obesity._live = true
  }
}

/**
 * Update hospital beds from SingStat M870301
 */
function updateHospitalBeds(merged, parsed) {
  const acute = parsed['Acute Hospitals']
  if (acute?.length) {
    merged.hospital_beds.data = mergeTimeSeries(merged.hospital_beds.data, acute)
    merged.hospital_beds._live = true
  }
}

/**
 * Update deaths by cause from SingStat M810131
 */
function updateDeathsByCause(merged, parsed) {
  const causeMapping = {
    'Malignant Neoplasms': 'cancer',
    'Heart And Hypertensive Diseases': 'heart_disease',
    'Pneumonia': 'pneumonia',
    'Cerebrovascular Disease': 'stroke'
  }

  for (const [seriesName, catKey] of Object.entries(causeMapping)) {
    const data = parsed[seriesName]
    if (data?.length && merged.deaths_by_cause?.categories?.[catKey]) {
      merged.deaths_by_cause.categories[catKey].data = data
      merged.deaths_by_cause._live = true
    }
  }
}

/**
 * Update psychiatric admissions from SingStat M870311
 */
function updatePsychiatricAdmissions(merged, parsed) {
  const psych = parsed['Psychiatric Hospitals Admissions']
  if (!psych) {
    // Try to find the row with 'Psychiatric' in it
    for (const [key, data] of Object.entries(parsed)) {
      if (key.includes('Psychiatric') && key.includes('Admissions') && data?.length) {
        merged.psychiatric_admissions.data = data
        merged.psychiatric_admissions._live = true
        return
      }
    }
  } else {
    merged.psychiatric_admissions.data = psych
    merged.psychiatric_admissions._live = true
  }
}

/**
 * Update TB incidence from SingStat M870361
 */
function updateTBIncidence(merged, parsed) {
  const tb = parsed['Incidence Rate Of Tuberculosis']
  if (tb?.length) {
    merged.tb_incidence.data = mergeTimeSeries(merged.tb_incidence.data, tb)
    merged.tb_incidence._live = true
  }
}

/**
 * Update % population aged 65+ from SingStat M810011
 * Calculates percentage from "65 Years & Over" / "Total Residents"
 */
function updateAged65Plus(merged, parsed) {
  const aged65 = parsed['65 Years & Over']
  const totalResidents = parsed['Total Residents']

  if (aged65?.length && totalResidents?.length) {
    const totalMap = new Map(totalResidents.map(d => [d.year, d.value]))
    const percentData = aged65
      .filter(d => totalMap.has(d.year) && totalMap.get(d.year) > 0)
      .map(d => ({
        year: d.year,
        value: Math.round((d.value / totalMap.get(d.year)) * 1000) / 10
      }))

    if (percentData.length && merged.aged_65_plus) {
      merged.aged_65_plus.data = mergeTimeSeries(merged.aged_65_plus.data, percentData)
      merged.aged_65_plus._live = true
    }
  }
}

/**
 * Update old-age support ratio from SingStat M810001
 */
function updateOldAgeSupportRatio(merged, parsed) {
  // Try different possible row names
  const candidates = [
    'Old-Age Support Ratio: Residents Aged 20-64 Years Per Resident Aged 65 Years & Over',
    'Old-Age Support Ratio (Residents Aged 20-64 Years Per Resident Aged 65 Years & Over)'
  ]

  for (const candidate of candidates) {
    const data = parsed[candidate]
    if (data?.length && merged.old_age_support_ratio) {
      merged.old_age_support_ratio.data = mergeTimeSeries(merged.old_age_support_ratio.data, data)
      merged.old_age_support_ratio._live = true
      return
    }
  }

  // Fallback: search for any row containing "Old-Age Support Ratio" and "20-64"
  for (const [key, data] of Object.entries(parsed)) {
    if (key.includes('Old-Age Support Ratio') && key.includes('20-64') && data?.length) {
      if (merged.old_age_support_ratio) {
        merged.old_age_support_ratio.data = mergeTimeSeries(merged.old_age_support_ratio.data, data)
        merged.old_age_support_ratio._live = true
      }
      return
    }
  }
}

/**
 * Update total fertility rate from SingStat M810091
 */
function updateTotalFertilityRate(merged, parsed) {
  const tfr = parsed['Total Fertility Rate']
  if (tfr?.length && merged.total_fertility_rate) {
    merged.total_fertility_rate.data = mergeTimeSeries(merged.total_fertility_rate.data, tfr)
    merged.total_fertility_rate._live = true
  }
}

/**
 * Merge two time series, preferring fresh data for overlapping years
 */
function mergeTimeSeries(existing, fresh) {
  const map = new Map()
  for (const d of existing || []) map.set(d.year, d.value)
  for (const d of fresh || []) map.set(d.year, d.value)
  return [...map.entries()]
    .map(([year, value]) => ({ year, value }))
    .sort((a, b) => a.year - b.year)
}

/**
 * Main: fetch all SingStat data, merge with fallback, return complete dataset.
 */
export async function fetchAllHealthData() {
  const merged = JSON.parse(JSON.stringify(fallbackData))
  let liveCount = 0

  try {
    const fetches = await Promise.allSettled([
      fetchSingStat(SINGSTAT_TABLES.lifeExpectancy),
      fetchSingStat(SINGSTAT_TABLES.chronicDisease),
      fetchSingStat(SINGSTAT_TABLES.healthExpenditure),
      fetchSingStat(SINGSTAT_TABLES.healthPersonnel),
      fetchSingStat(SINGSTAT_TABLES.childhoodObesity),
      fetchSingStat(SINGSTAT_TABLES.hospitalBeds),
      fetchSingStat(SINGSTAT_TABLES.deathsByCause),
      fetchSingStat(SINGSTAT_TABLES.hospitalOutpatient),
      fetchSingStat(SINGSTAT_TABLES.infectiousDisease),
      fetchSingStat(SINGSTAT_TABLES.populationByAge),
      fetchSingStat(SINGSTAT_TABLES.populationIndicators),
      fetchSingStat(SINGSTAT_TABLES.fertilityRates)
    ])

    const results = fetches.map(f => f.status === 'fulfilled' ? parseRows(f.value) : null)

    if (results[0]) { updateLifeExpectancy(merged, results[0]); liveCount++ }
    if (results[1]) { updateChronicDisease(merged, results[1]); liveCount++ }
    if (results[2]) { updateHealthExpenditure(merged, results[2]); liveCount++ }
    if (results[3]) { updateHealthPersonnel(merged, results[3]); liveCount++ }
    if (results[4]) { updateChildhoodObesity(merged, results[4]); liveCount++ }
    if (results[5]) { updateHospitalBeds(merged, results[5]); liveCount++ }
    if (results[6]) { updateDeathsByCause(merged, results[6]); liveCount++ }
    if (results[7]) { updatePsychiatricAdmissions(merged, results[7]); liveCount++ }
    if (results[8]) { updateTBIncidence(merged, results[8]); liveCount++ }
    if (results[9]) { updateAged65Plus(merged, results[9]); liveCount++ }
    if (results[10]) { updateOldAgeSupportRatio(merged, results[10]); liveCount++ }
    if (results[11]) { updateTotalFertilityRate(merged, results[11]); liveCount++ }

    merged._lastFetched = new Date().toISOString()
    merged._sources = {
      singstat: liveCount > 0 ? 'live' : 'fallback',
      liveTableCount: liveCount,
      totalTables: fetches.length
    }

    return merged
  } catch {
    return {
      ...fallbackData,
      _lastFetched: null,
      _sources: { singstat: 'fallback', liveTableCount: 0 }
    }
  }
}
