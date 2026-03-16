// Shared data for hero arc lens and Snapshot category pills
// Colors are matched 1:1 between arcs and pills

export const CATEGORIES = [
  { id: 'all', label: 'All', color: '#6B7280' },
  { id: 'demographics', label: 'Demographics', color: '#6366F1' },
  { id: 'chronic', label: 'Chronic Disease', color: '#EF4444' },
  { id: 'lifestyle', label: 'Lifestyle', color: '#F59E0B' },
  { id: 'healthcare', label: 'Public Health', color: '#8B5CF6' },
  { id: 'longevity', label: 'Longevity', color: '#0D9488' },
]

// Ring definitions for the lens SVG (inner → outer)
export const RINGS = [
  { id: 'longevity', label: 'Longevity', r: 50, strokeWidth: 4, color: '#0D9488' },
  { id: 'chronic', label: 'Chronic Disease', r: 105, strokeWidth: 3.5, color: '#EF4444' },
  { id: 'lifestyle', label: 'Lifestyle', r: 155, strokeWidth: 3, color: '#F59E0B' },
  { id: 'demographics', label: 'Demographics', r: 200, strokeWidth: 2.5, color: '#6366F1' },
  { id: 'healthcare', label: 'Healthcare', r: 245, strokeWidth: 2, color: '#8B5CF6' },
]

export const indicators = [
  { key: 'life_expectancy', category: 'longevity' },
  { key: 'diabetes_prevalence', category: 'chronic' },
  { key: 'hypertension_prevalence', category: 'chronic' },
  { key: 'obesity_prevalence', category: 'chronic' },
  { key: 'daily_smoking_rate', category: 'lifestyle' },
  { key: 'govt_health_expenditure', category: 'healthcare' },
  { key: 'high_cholesterol_prevalence', category: 'chronic' },
  { key: 'chronic_disease_screening', category: 'healthcare' },
  { key: 'physical_activity', category: 'lifestyle' },
  { key: 'aged_65_plus', category: 'demographics' },
  { key: 'old_age_support_ratio', category: 'demographics' },
  { key: 'total_fertility_rate', category: 'demographics' }
]

// Grouped indicators by category (for grouped section layout)
export const GROUPED_INDICATORS = CATEGORIES
  .filter(c => c.id !== 'all')
  .map(cat => ({
    ...cat,
    indicators: indicators.filter(ind => ind.category === cat.id),
  }))

export const positiveUpKeys = new Set([
  'life_expectancy', 'govt_health_expenditure',
  'chronic_disease_screening', 'physical_activity',
  'old_age_support_ratio', 'total_fertility_rate'
])

// ── Arc geometry for the hero circle lens ──
// 5 arcs spanning 70° each with 2° gaps = 360°
// Order matches CATEGORIES (excluding 'all') for pill position mapping
export const ARCS = [
  { id: 'demographics', label: 'Demographics', startAngle: 216, endAngle: 286, color: '#6366F1' },
  { id: 'chronic', label: 'Chronic Disease', startAngle: 72, endAngle: 142, color: '#EF4444' },
  { id: 'lifestyle', label: 'Lifestyle', startAngle: 144, endAngle: 214, color: '#F59E0B' },
  { id: 'healthcare', label: 'Public Health', startAngle: 288, endAngle: 358, color: '#8B5CF6' },
  { id: 'longevity', label: 'Longevity', startAngle: 0, endAngle: 70, color: '#0D9488' },
]

/** Convert polar coords to cartesian */
export function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/** Generate SVG arc path d attribute */
export function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
}
