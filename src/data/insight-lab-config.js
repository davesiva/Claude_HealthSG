export const THEMES = [
  {
    id: 'silver-tsunami',
    title: 'Silver Tsunami',
    subtitle: 'Aging, loneliness & the demographic squeeze',
    icon: 'Users',
    color: '#6366F1',
    comparisons: [
      {
        id: 'aging-curve',
        title: 'The Aging Curve',
        subtitle: 'TFR hit a historic low of 0.87 in 2025 — how fast is the population aging?',
        yearRange: [1970, 2025],
        series: [
          { dataPath: 'elderly_indicators.pct_65_plus', label: 'Aged 65+ (%)', axis: 'left', type: 'area', color: '#6366F1', unit: '%' },
          { dataPath: 'total_fertility_rate', label: 'Fertility Rate', axis: 'right', type: 'line', color: '#EF4444', unit: '' }
        ],
        leftAxisLabel: 'Population 65+ (%)',
        rightAxisLabel: 'Total Fertility Rate',
        tooltip: 'The proportion of residents aged 65+ is rising sharply while the total fertility rate (births per woman) has fallen well below the 2.1 replacement level. These two trends are the core drivers of Singapore\'s demographic challenge.',
        narrativePrompt: 'Analyze Singapore\'s demographic squeeze: the % aged 65+ has risen from 3.4% (1970) to nearly 20% (2024) while TFR has fallen from 3.1 to 0.87. Extrapolate what this means for Singapore in 2030 and 2050. Include the fact that by 2030, 1 in 4 residents will be 65+.'
      },
      {
        id: 'growing-old-alone',
        title: 'Growing Old Alone',
        subtitle: 'Elderly living alone vs mental health admissions',
        yearRange: [2000, 2025],
        series: [
          { dataPath: 'elderly_indicators.elderly_living_alone_pct', label: 'Elderly Living Alone (%)', axis: 'left', type: 'line', color: '#6366F1', unit: '%' },
          { dataPath: 'psychiatric_admissions', label: 'Psych Admissions', axis: 'right', type: 'bar', color: '#F59E0B', unit: '' }
        ],
        leftAxisLabel: 'Living Alone (%)',
        rightAxisLabel: 'Psychiatric Admissions',
        tooltip: 'Proportion of elderly residents (65+) who live alone in their household, compared with total psychiatric hospital admissions. Social isolation is a known risk factor for mental health issues in the elderly.',
        narrativePrompt: 'Analyze the relationship between elderly living alone (%) and psychiatric hospital admissions in Singapore. While elderly living alone has stayed relatively stable at 7-8%, psychiatric admissions have risen from ~7,000 to over 11,000. What might explain this? Consider reduced stigma, aging population size, and mental health awareness.'
      },
      {
        id: 'support-squeeze',
        title: 'The Support Squeeze',
        subtitle: 'Fewer workers per retiree, more health spending',
        yearRange: [2000, 2025],
        series: [
          { dataPath: 'old_age_support_ratio', label: 'Support Ratio', axis: 'left', type: 'line', color: '#0D9488', unit: '' },
          { dataPath: 'govt_health_expenditure', label: 'Health Spend (S$B)', axis: 'right', type: 'bar', color: '#EF4444', unit: 'S$B' }
        ],
        leftAxisLabel: 'Workers per Retiree',
        rightAxisLabel: 'Health Expenditure (S$B)',
        tooltip: 'The old-age support ratio (working-age adults 20-64 per elderly 65+) has fallen from ~10 in 2000 to ~3.5 in 2024. At the same time, government health spending has surged. This is the fiscal pressure of an aging society.',
        narrativePrompt: 'Analyze the inverse correlation between Singapore\'s old-age support ratio (declining from 9.9 to 3.5) and government health expenditure (rising from under S$5B to nearly S$17B). What does this trend mean for fiscal sustainability? How might Singapore need to adapt its healthcare funding model?'
      },
      {
        id: 'working-longer',
        title: 'Working Longer',
        subtitle: 'More elderly in the workforce — by choice or necessity?',
        yearRange: [1990, 2025],
        series: [
          { dataPath: 'elderly_indicators.elderly_labour_force_pct', label: 'Elderly in Labour Force (%)', axis: 'left', type: 'line', color: '#0D9488', unit: '%' },
          { dataPath: 'elderly_indicators.elderly_death_rate', label: 'Elderly Death Rate (per 1,000)', axis: 'right', type: 'line', color: '#9CA3AF', unit: '‰' }
        ],
        leftAxisLabel: 'In Labour Force (%)',
        rightAxisLabel: 'Death Rate (per 1,000)',
        tooltip: 'The proportion of elderly (65+) in the labour force has more than doubled since 2000. Is this because they are healthier (declining death rates), because they choose to stay active, or because they need to? The declining death rate suggests better health enables longer working lives.',
        narrativePrompt: 'Analyze the relationship between elderly labour force participation (rising from ~13% to over 30%) and elderly death rates (declining from ~45 to ~25 per 1,000) in Singapore. Are elderly Singaporeans working longer because they are healthier, or because of financial necessity? Consider Singapore\'s retirement age changes and CPF policies.'
      },
      {
        id: 'longevity-at-65',
        title: 'Living Longer at 65',
        subtitle: '50 years of gains in elderly life expectancy',
        yearRange: [1970, 2025],
        series: [
          { dataPath: 'elderly_indicators.life_expectancy_at_65', label: 'Life Expectancy at 65 (years)', axis: 'left', type: 'area', color: '#6366F1', unit: ' yrs' },
          { dataPath: 'elderly_indicators.pct_65_plus', label: 'Population 65+ (%)', axis: 'right', type: 'line', color: '#F59E0B', unit: '%' }
        ],
        leftAxisLabel: 'Years at 65',
        rightAxisLabel: 'Population 65+ (%)',
        tooltip: 'Life expectancy at age 65 shows how many more years a 65-year-old can expect to live. Combined with the rising share of elderly, this shows the expanding period of old age that healthcare and social systems must support.',
        narrativePrompt: 'Analyze trends in life expectancy at age 65 in Singapore (from ~15 years in the 1980s to ~21 years now) alongside the rising proportion of elderly. What does it mean that a 65-year-old today can expect to live to 86? Discuss implications for healthcare costs, long-term care needs, and retirement adequacy.'
      },
      {
        id: 'demographic-squeeze',
        title: 'The Demographic Squeeze',
        subtitle: 'Fertility falling as elderly population rises',
        yearRange: [1980, 2025],
        series: [
          { dataPath: 'total_fertility_rate', label: 'Fertility Rate', axis: 'left', type: 'line', color: '#EF4444', unit: '' },
          { dataPath: 'old_age_support_ratio', label: 'Support Ratio', axis: 'right', type: 'line', color: '#0D9488', unit: '' }
        ],
        leftAxisLabel: 'Births per Woman',
        rightAxisLabel: 'Support Ratio',
        tooltip: 'Total fertility rate (births per woman) and old-age support ratio (workers per retiree) are both declining. When both fall simultaneously, the pressure on each working adult intensifies — they must support more elderly with fewer siblings to share the burden.',
        narrativePrompt: 'Analyze the simultaneous decline of Singapore\'s total fertility rate (from 1.82 in 1980 to 0.87 in 2025) and old-age support ratio (from ~10 to ~3.5). These two lines converging represent a demographic squeeze. What are the policy implications? Discuss immigration, pro-natalist policies, and automation as potential responses.'
      }
    ]
  },
  {
    id: 'cost-of-care',
    title: 'The Cost of Care',
    subtitle: 'Income inequality, spending & chronic disease',
    icon: 'DollarSign',
    color: '#0D9488',
    comparisons: [
      {
        id: 'gini-vs-chronic',
        title: 'Inequality & Disease',
        subtitle: 'As income inequality narrows, do chronic diseases decline?',
        yearRange: [2000, 2025],
        series: [
          { dataPath: 'household_income.gini', label: 'Gini Coefficient', axis: 'left', type: 'line', color: '#0D9488', unit: '' },
          { dataPath: 'diabetes_prevalence', label: 'Diabetes (%)', axis: 'right', type: 'line', color: '#F59E0B', unit: '%' },
          { dataPath: 'hypertension_prevalence', label: 'Hypertension (%)', axis: 'right', type: 'line', color: '#EF4444', unit: '%' }
        ],
        leftAxisLabel: 'Gini Coefficient',
        rightAxisLabel: 'Prevalence (%)',
        tooltip: 'The Gini coefficient measures income inequality (0 = perfect equality, 1 = maximum inequality). This uses the measure after government transfers and taxes. A declining Gini means inequality is narrowing.',
        narrativePrompt: 'Analyze the relationship between income inequality (Gini coefficient after transfers/taxes) and chronic disease prevalence (diabetes, hypertension) in Singapore from 2000-2024. The Gini has declined from ~0.43 to ~0.36 while diabetes stayed around 8-9% and hypertension methodology changed in 2020. What does this suggest about the relationship between inequality and health outcomes in Singapore?'
      },
      {
        id: 'income-vs-health-spend',
        title: 'Income Growth & Health Spending',
        subtitle: 'Government spending vs household income trends',
        yearRange: [2000, 2025],
        series: [
          { dataPath: 'household_income.median_income', label: 'Median Income (S$)', axis: 'left', type: 'line', color: '#0D9488', unit: 'S$' },
          { dataPath: 'household_income.income_20th_pct', label: '20th Percentile (S$)', axis: 'left', type: 'line', color: '#6366F1', unit: 'S$' },
          { dataPath: 'govt_health_expenditure', label: 'Govt Health Spend (S$B)', axis: 'right', type: 'bar', color: '#F59E0B', unit: 'S$B' }
        ],
        leftAxisLabel: 'Monthly Income (S$)',
        rightAxisLabel: 'Health Expenditure (S$B)',
        tooltip: 'Compares household income (median and 20th percentile, including employer CPF) with government health expenditure. The 20th percentile represents lower-income households.',
        narrativePrompt: 'Analyze how Singapore government health expenditure growth compares to household income growth from 2000-2024. Median income roughly doubled while health spending grew much faster. The 20th percentile income also grew. What does this suggest about the sustainability of healthcare spending and its accessibility for lower-income households?'
      },
      {
        id: 'household-health-spend',
        title: 'What Families Spend on Health',
        subtitle: 'Household health expenditure every 5 years',
        yearRange: [1993, 2023],
        series: [
          { dataPath: 'household_expenditure.health', label: 'Health Spend (S$)', axis: 'left', type: 'bar', color: '#0D9488', unit: 'S$' },
          { dataPath: 'household_expenditure.total', label: 'Total Spend (S$)', axis: 'right', type: 'line', color: '#9CA3AF', unit: 'S$' }
        ],
        leftAxisLabel: 'Monthly Health (S$)',
        rightAxisLabel: 'Total Monthly (S$)',
        tooltip: 'Average monthly household expenditure on health vs total expenditure. Data from the Household Expenditure Survey conducted every 5 years. Health includes medical care, medicines, and health services.',
        narrativePrompt: 'Analyze Singapore household health expenditure trends from 1993-2023 (quinquennial data). Health spending grew from S$61 to S$225/month while total spending roughly doubled. What proportion of household budgets goes to health, and what does this trend mean for families as the population ages?'
      }
    ]
  },
  {
    id: 'cancer-landscape',
    title: 'Cancer in Focus',
    subtitle: 'Incidence, mortality & the demographic divide',
    icon: 'Ribbon',
    color: '#B388FF',
    comparisons: [
      {
        id: 'incidence-vs-mortality',
        title: 'Incidence vs Mortality',
        subtitle: 'More cancers detected, but fewer deaths — is treatment winning?',
        yearRange: [1970, 2023],
        series: [
          { dataPath: 'cancer_incidence', label: 'Incidence Rate', axis: 'left', type: 'area', color: '#E8A0BF', unit: '/100k' },
          { dataPath: 'cancer_mortality', label: 'Mortality Rate', axis: 'right', type: 'line', color: '#7C5CBF', unit: '/100k' }
        ],
        leftAxisLabel: 'Incidence (per 100k)',
        rightAxisLabel: 'Mortality (per 100k)',
        tooltip: 'Age-standardised cancer incidence has risen ~27% since 1970 (more cancers being detected), while mortality has fallen ~30% (fewer deaths per case). This widening gap reflects advances in screening, early detection, and treatment.',
        narrativePrompt: 'Analyze the divergence between cancer incidence (rising from ~190 to ~241 per 100k) and cancer mortality (falling from ~93 to ~65 per 100k) in Singapore from 1970 to 2023. What does this widening gap tell us about screening effectiveness and treatment advances? Consider the role of national screening programmes, advances in oncology, and the shift toward earlier-stage detection.'
      },
      {
        id: 'cancer-gender-gap',
        title: 'The Gender Gap',
        subtitle: 'Males face higher incidence and much higher mortality',
        yearRange: [1970, 2023],
        series: [
          { dataPath: 'cancer_incidence.by_gender.male', label: 'Male Incidence', axis: 'left', type: 'line', color: '#3B82F6', unit: '/100k' },
          { dataPath: 'cancer_incidence.by_gender.female', label: 'Female Incidence', axis: 'left', type: 'line', color: '#EC4899', unit: '/100k' },
          { dataPath: 'cancer_mortality.by_gender.male', label: 'Male Mortality', axis: 'right', type: 'line', color: '#1E40AF', unit: '/100k' },
          { dataPath: 'cancer_mortality.by_gender.female', label: 'Female Mortality', axis: 'right', type: 'line', color: '#BE185D', unit: '/100k' }
        ],
        leftAxisLabel: 'Incidence (per 100k)',
        rightAxisLabel: 'Mortality (per 100k)',
        tooltip: 'Males consistently have higher cancer incidence and mortality rates than females. The gap is partly explained by cancer types (prostate, lung, liver in males vs breast in females), lifestyle factors (historically higher smoking rates in males), and screening uptake differences.',
        narrativePrompt: 'Analyze the gender gap in cancer incidence and mortality in Singapore from 1970-2023. Male incidence (~280/100k) exceeds female (~210/100k), and male mortality is significantly higher. What factors contribute? Consider cancer types (prostate/lung/liver vs breast), historical smoking rates, occupational exposure, and screening behaviours. Has the gap narrowed or widened over time?'
      },
      {
        id: 'cancer-ethnicity',
        title: 'Cancer Across Ethnicities',
        subtitle: 'How cancer burden varies by ethnic group',
        yearRange: [1970, 2023],
        series: [
          { dataPath: 'cancer_incidence.by_ethnicity.chinese', label: 'Chinese Incidence', axis: 'left', type: 'line', color: '#EF4444', unit: '/100k' },
          { dataPath: 'cancer_incidence.by_ethnicity.malay', label: 'Malay Incidence', axis: 'left', type: 'line', color: '#F59E0B', unit: '/100k' },
          { dataPath: 'cancer_incidence.by_ethnicity.indian', label: 'Indian Incidence', axis: 'left', type: 'line', color: '#6366F1', unit: '/100k' }
        ],
        leftAxisLabel: 'Incidence (per 100k)',
        tooltip: 'Cancer incidence varies across Singapore\'s three main ethnic groups. Differences may reflect genetic predisposition, dietary patterns, lifestyle factors, and screening uptake rates across communities.',
        narrativePrompt: 'Analyze cancer incidence trends across Chinese, Malay, and Indian populations in Singapore from 1970-2023. Chinese have historically had the highest rates. Are the ethnic groups converging or diverging? What might explain the differences — genetics, diet, lifestyle, or screening access? Consider the impact of westernisation of diet across all groups.'
      },
      {
        id: 'cancer-top-sites',
        title: 'Top Cancers — Male vs Female',
        subtitle: 'The 5 most common cancers differ sharply by gender (2019–2023)',
        chartType: 'butterfly',
        dataPath: 'cancer_top_incident',
        tooltip: 'The top 5 cancers by incidence are strikingly different between males and females. Breast cancer alone accounts for nearly 30% of all female cancers, while prostate, colorectal, and lung cancers dominate in males.',
        narrativePrompt: 'Compare the top 5 cancers by incidence in Singapore males vs females (2019-2023). Prostate (18%) leads in males while breast (29.9%) dominates in females. Colorectal cancer is the only top-3 cancer common to both. What do these patterns suggest about gender-specific screening priorities and risk factors?'
      },
      {
        id: 'cancer-age-cliff',
        title: 'Cancer and Age',
        subtitle: 'The dramatic rise in cancer risk after 50',
        chartType: 'age-bars',
        dataPath: 'cancer_age_distribution',
        tooltip: 'Cancer incidence rises exponentially with age. The crude rate jumps from ~160 per 100k in the 40-49 bracket to over 2,000 per 100k in the 70-79 bracket — a 13-fold increase. This age-incidence cliff underscores why screening becomes critical from age 50.',
        narrativePrompt: 'Analyze the age distribution of cancer incidence in Singapore (2019-2023). The rate jumps dramatically after age 50 — from ~160/100k (40-49) to ~1,077/100k (60-69) to ~2,099/100k (70-79) in males. Females show a different pattern with higher rates in younger brackets (30-49) due to breast cancer. What does this mean for screening policy and age-based targeting?'
      }
    ]
  },
  {
    id: 'next-gen',
    title: 'The Next Generation',
    subtitle: 'Children\'s health & healthcare workforce pipeline',
    icon: 'GraduationCap',
    color: '#F59E0B',
    comparisons: [
      {
        id: 'kids-health',
        title: 'Are Kids Getting Healthier?',
        subtitle: 'Childhood obesity vs declining birth rates',
        yearRange: [2010, 2025],
        series: [
          { dataPath: 'childhood_obesity', label: 'Childhood Obesity (%)', axis: 'left', type: 'line', color: '#EF4444', unit: '%' },
          { dataPath: 'total_fertility_rate', label: 'Fertility Rate', axis: 'right', type: 'line', color: '#6366F1', unit: '' }
        ],
        leftAxisLabel: 'Obesity (%)',
        rightAxisLabel: 'Fertility Rate',
        tooltip: 'Childhood obesity among Primary 1 children (~7 years old) alongside the total fertility rate. Singapore is having fewer children — are those children healthier? The recent drop in childhood obesity to 8.9% (2024) is encouraging.',
        narrativePrompt: 'Analyze childhood obesity trends (Primary 1) alongside fertility rate in Singapore. While TFR has fallen to 0.87, childhood obesity has also declined to 8.9% in 2024 — the lowest in over a decade. Is there a connection? Discuss the role of HPB programmes, school nutrition policies, and parental health awareness. Consider the 2021 COVID spike.'
      },
      {
        id: 'workforce-pipeline',
        title: 'Healthcare Workforce Pipeline',
        subtitle: 'Are we training enough healthcare workers?',
        yearRange: [2005, 2025],
        series: [
          { dataPath: 'university_intake.health_sciences', label: 'Health Sciences Intake', axis: 'left', type: 'bar', color: '#0D9488', unit: '' },
          { dataPath: 'health_personnel', label: 'Doctors per 10,000', axis: 'right', type: 'line', color: '#F59E0B', unit: '' }
        ],
        leftAxisLabel: 'University Intake',
        rightAxisLabel: 'Doctors per 10,000',
        tooltip: 'University health sciences intake (nursing, pharmacy, allied health) compared with the doctor-to-population ratio. As the population ages, Singapore needs to rapidly expand its healthcare workforce. The question is whether training pipelines are keeping pace with demand.',
        narrativePrompt: 'Analyze Singapore\'s healthcare workforce pipeline: university health sciences intake has tripled from ~350 (2011) to ~1,150 (2024), while doctors per 10,000 population has grown from 14 to 29. Is this pace sufficient given the aging population? By 2030, 1 in 4 residents will be 65+. Discuss the gap between supply and demand.'
      }
    ]
  }
]
