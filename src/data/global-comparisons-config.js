export const INDICATORS = [
  {
    id: 'life_expectancy',
    title: 'Life Expectancy',
    icon: 'Heart',
    color: '#1E8E3E',
    dataKey: 'life_expectancy',
    unit: 'years',
    narrative: 'Singapore consistently ranks among the top 3 globally for life expectancy \u2014 a testament to its healthcare system, public hygiene, and preventive care.',
    yearRange: [1960, 2023],
    domain: [40, 90],
    source: 'UN World Population Prospects, Human Mortality Database'
  },
  {
    id: 'fertility',
    title: 'Fertility Rate',
    icon: 'Baby',
    color: '#F59E0B',
    dataKey: 'fertility',
    unit: 'births',
    narrative: "Singapore's TFR of 0.94 is well below the replacement level of 2.1 and among the lowest in the world \u2014 driving rapid population ageing.",
    yearRange: [1960, 2023],
    domain: [0, 7],
    source: 'UN World Population Prospects'
  },
  {
    id: 'obesity',
    title: 'Obesity',
    icon: 'TrendingUp',
    color: '#EF4444',
    dataKey: 'obesity',
    unit: '%',
    narrative: 'Obesity is rising everywhere, but Singapore remains well below the global average. Malaysia, next door, has one of the highest rates in Asia.',
    yearRange: [1990, 2022],
    source: 'WHO Global Health Observatory, NCD Risk Factor Collaboration'
  },
  {
    id: 'health_spend_gdp',
    title: 'Health Spend (% GDP)',
    icon: 'DollarSign',
    color: '#5370E0',
    dataKey: 'health_spend_gdp',
    unit: '% GDP',
    narrative: 'Singapore spends just ~5% of GDP on healthcare yet achieves world-leading outcomes \u2014 one of the most efficient health systems globally.',
    yearRange: [2000, 2022],
    source: 'WHO Global Health Expenditure Database'
  },
  {
    id: 'out_of_pocket',
    title: 'Out-of-Pocket Spend',
    icon: 'Wallet',
    color: '#8B5CF6',
    dataKey: 'out_of_pocket',
    unit: '%',
    narrative: "Singapore has halved its out-of-pocket burden from ~49% to ~25% since 2000, shifting costs toward government subsidies and insurance schemes like MediShield Life.",
    yearRange: [2000, 2023],
    source: 'World Bank, WHO Global Health Expenditure Database'
  }
]

export const ENTITY_STYLES = {
  singapore: { label: 'Singapore', color: '#5370E0', strokeWidth: 2.5, strokeDasharray: undefined },
  world: { label: 'World', color: '#9CA3AF', strokeWidth: 1.5, strokeDasharray: '6 3' },
  regional: { label: 'SE Asia / East Asia & Pacific', color: '#5370E0', strokeWidth: 1.5, strokeDasharray: '4 2' },
  malaysia: { label: 'Malaysia', color: '#F59E0B', strokeWidth: 1.5, strokeDasharray: '2 2' }
}
