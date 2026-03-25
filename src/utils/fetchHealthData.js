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
  fertilityRates: 'M810091',
  // Insight Lab tables
  householdIncome: 'M810361',
  elderlyIndicators: 'M810611',
  householdExpenditure: 'M212981',
  hospitalAdmissionRates: 'M870321',
  universityIntake: 'M850761'
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
    'Cerebrovascular Disease': 'stroke',
    'Infective And Parasitic Diseases': 'infectious'
  }

  // Filter to <= 2024 (2025 data has incomplete cause classification)
  const filterYears = (data) => data.filter(d => d.year <= 2024)

  for (const [seriesName, catKey] of Object.entries(causeMapping)) {
    const data = parsed[seriesName]
    if (data?.length && merged.deaths_by_cause?.categories?.[catKey]) {
      merged.deaths_by_cause.categories[catKey].data = filterYears(data)
      merged.deaths_by_cause._live = true
    }
  }

  // Update total and recompute "other" category
  const totalData = parsed['Total Deaths By Causes']
  if (totalData?.length) {
    merged.deaths_by_cause.total = filterYears(totalData)

    // Recompute other = total - 5 named causes
    const namedKeys = ['cancer', 'heart_disease', 'pneumonia', 'stroke', 'infectious']
    merged.deaths_by_cause.categories.other = {
      label: 'Other Causes',
      data: merged.deaths_by_cause.total.map(({ year, value: total }) => {
        const namedSum = namedKeys.reduce((sum, key) => {
          const found = merged.deaths_by_cause.categories[key]?.data?.find(d => d.year === year)
          return sum + (found?.value || 0)
        }, 0)
        return { year, value: total - namedSum }
      })
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
 * Update household income data from SingStat M810361
 */
function updateHouseholdIncome(merged, parsed) {
  if (!merged.household_income) {
    merged.household_income = { gini: { data: [] }, median_income: { data: [] }, income_20th_pct: { data: [] } }
  }

  const giniRow = parsed['Gini Coefficient Based On Household Employment Income Per Household Member (Including Employer CPF Contributions) After Accounting For Government Transfers And Taxes']
  if (giniRow?.length) {
    merged.household_income.gini.data = mergeTimeSeries(merged.household_income.gini.data, giniRow)
    merged.household_income._live = true
  }

  const median = parsed['Median Monthly Household Employment Income Including Employer CPF Contributions']
  if (median?.length) {
    merged.household_income.median_income.data = mergeTimeSeries(merged.household_income.median_income.data, median)
  }

  const pct20 = parsed['Monthly Household Employment Income Per Household Member (Including Employer CPF Contributions) At 20th Percentile']
  if (pct20?.length) {
    merged.household_income.income_20th_pct.data = mergeTimeSeries(merged.household_income.income_20th_pct.data, pct20)
  }
}

/**
 * Update elderly indicators from SingStat M810611
 */
function updateElderlyIndicators(merged, parsed) {
  if (!merged.elderly_indicators) {
    merged.elderly_indicators = {
      pct_65_plus: { data: [] },
      life_expectancy_at_65: { data: [] },
      elderly_living_alone_pct: { data: [] },
      elderly_labour_force_pct: { data: [] },
      elderly_death_rate: { data: [] },
      elderly_death_heart: { data: [] },
      elderly_death_cancer: { data: [] }
    }
  }

  const pct65 = parsed['Proportion Of Elderly Residents (65 Years & Over) Among Resident Population']
  if (pct65?.length) {
    merged.elderly_indicators.pct_65_plus.data = mergeTimeSeries(merged.elderly_indicators.pct_65_plus.data, pct65)
    merged.elderly_indicators._live = true
  }

  const le65 = parsed['Life Expectancy At Age 65 Years']
  if (le65?.length) {
    merged.elderly_indicators.life_expectancy_at_65.data = mergeTimeSeries(merged.elderly_indicators.life_expectancy_at_65.data, le65)
  }

  const livingAlone = parsed['Proportion Of Elderly Residents (65 Years & Over) In Resident Households Who Are Living Alone In Household']
  if (livingAlone?.length) {
    merged.elderly_indicators.elderly_living_alone_pct.data = mergeTimeSeries(merged.elderly_indicators.elderly_living_alone_pct.data, livingAlone)
  }

  const labourForce = parsed['Proportion Of Elderly Residents (65 Years & Over) In Labour Force']
  if (labourForce?.length) {
    merged.elderly_indicators.elderly_labour_force_pct.data = mergeTimeSeries(merged.elderly_indicators.elderly_labour_force_pct.data, labourForce)
  }

  const deathRate = parsed['Death Rate Of Elderly Residents']
  if (deathRate?.length) {
    merged.elderly_indicators.elderly_death_rate.data = mergeTimeSeries(merged.elderly_indicators.elderly_death_rate.data, deathRate)
  }

  const heartDeath = parsed['Heart & Hypertensive Diseases']
  if (heartDeath?.length) {
    merged.elderly_indicators.elderly_death_heart.data = mergeTimeSeries(merged.elderly_indicators.elderly_death_heart.data, heartDeath)
  }

  const cancerDeath = parsed['Cancer (Malignant Neoplasms)']
  if (cancerDeath?.length) {
    merged.elderly_indicators.elderly_death_cancer.data = mergeTimeSeries(merged.elderly_indicators.elderly_death_cancer.data, cancerDeath)
  }
}

/**
 * Update household expenditure from SingStat M212981 (quinquennial)
 */
function updateHouseholdExpenditure(merged, parsed) {
  if (!merged.household_expenditure) {
    merged.household_expenditure = { health: { data: [] }, total: { data: [] } }
  }

  const health = parsed['Health']
  if (health?.length) {
    merged.household_expenditure.health.data = mergeTimeSeries(merged.household_expenditure.health.data, health)
    merged.household_expenditure._live = true
  }

  const total = parsed['Total']
  if (total?.length) {
    merged.household_expenditure.total.data = mergeTimeSeries(merged.household_expenditure.total.data, total)
  }
}

/**
 * Update hospital admission rates from SingStat M870321
 */
function updateHospitalAdmissionRates(merged, parsed) {
  if (!merged.hospital_admission_rates) {
    merged.hospital_admission_rates = { psychiatric_total: { data: [] } }
  }

  // Find psychiatric admission rate rows
  for (const [key, data] of Object.entries(parsed)) {
    if (key.includes('Psychiatric') && !key.includes('Male') && !key.includes('Female') && data?.length) {
      // Get the first match that looks like a total
      if (key.includes('Total') || (!key.includes('Years') && !key.includes('Above'))) {
        merged.hospital_admission_rates.psychiatric_total.data = mergeTimeSeries(
          merged.hospital_admission_rates.psychiatric_total.data, data
        )
        merged.hospital_admission_rates._live = true
        break
      }
    }
  }
}

/**
 * Update university intake from SingStat M850761
 */
function updateUniversityIntake(merged, parsed) {
  if (!merged.university_intake) {
    merged.university_intake = { health_sciences: { data: [] }, total: { data: [] } }
  }

  const healthSci = parsed['Health Sciences']
  if (healthSci?.length) {
    merged.university_intake.health_sciences.data = mergeTimeSeries(merged.university_intake.health_sciences.data, healthSci)
    merged.university_intake._live = true
  }

  const total = parsed['Total Intake']
  if (total?.length) {
    merged.university_intake.total.data = mergeTimeSeries(merged.university_intake.total.data, total)
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
      fetchSingStat(SINGSTAT_TABLES.fertilityRates),
      // Insight Lab tables
      fetchSingStat(SINGSTAT_TABLES.householdIncome),
      fetchSingStat(SINGSTAT_TABLES.elderlyIndicators),
      fetchSingStat(SINGSTAT_TABLES.householdExpenditure),
      fetchSingStat(SINGSTAT_TABLES.hospitalAdmissionRates),
      fetchSingStat(SINGSTAT_TABLES.universityIntake)
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
    // Insight Lab tables
    if (results[12]) { updateHouseholdIncome(merged, results[12]); liveCount++ }
    if (results[13]) { updateElderlyIndicators(merged, results[13]); liveCount++ }
    if (results[14]) { updateHouseholdExpenditure(merged, results[14]); liveCount++ }
    if (results[15]) { updateHospitalAdmissionRates(merged, results[15]); liveCount++ }
    if (results[16]) { updateUniversityIntake(merged, results[16]); liveCount++ }

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
