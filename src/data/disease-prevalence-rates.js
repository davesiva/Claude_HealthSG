// National age-specific prevalence rates from NPHS 2022/2024
// These are applied to each planning area's age distribution to estimate local burden
// Source: Health Promotion Board, National Population Health Survey

// Diabetes prevalence by age group (%)
export const diabetesRates = {
  '18_29': 0.017,
  '30_39': 0.045,
  '40_49': 0.095,
  '50_59': 0.164,
  '60_69': 0.245,
  '70_plus': 0.312,
}

// Hypertension prevalence by age group (%)
export const hypertensionRates = {
  '18_29': 0.058,
  '30_39': 0.117,
  '40_49': 0.225,
  '50_59': 0.378,
  '60_69': 0.538,
  '70_plus': 0.674,
}

// Mapping from census age bands to prevalence age groups
export const ageBandMapping = {
  '0_4': null,       // not applicable
  '5_9': null,
  '10_14': null,
  '15_19': '18_29',  // partial overlap, best approximation
  '20_24': '18_29',
  '25_29': '18_29',
  '30_34': '30_39',
  '35_39': '30_39',
  '40_44': '40_49',
  '45_49': '40_49',
  '50_54': '50_59',
  '55_59': '50_59',
  '60_64': '60_69',
  '65_69': '60_69',
  '70_74': '70_plus',
  '75_79': '70_plus',
  '80_84': '70_plus',
  '85_89': '70_plus',
  '90andOver': '70_plus',
}
