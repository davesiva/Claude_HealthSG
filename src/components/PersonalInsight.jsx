import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Lock } from 'lucide-react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { streamHealthSG } from '../utils/anthropic'
import { useHealthData } from '../context/HealthDataContext'
import InfoTooltip from './InfoTooltip'
import { renderMarkdownParagraphs } from '../utils/renderMarkdown'
import ReportButton from './report/ReportButton'

// ── Constants ──
const AGE_GROUPS = ['18-29', '30-39', '40-49', '50-59', '60-69', '70+']
const GENDERS = ['Male', 'Female']
const ETHNICITIES = ['Chinese', 'Malay', 'Indian', 'Others']
const SMOKING_OPTIONS = ['Never', 'Former', 'Current']
const ACTIVITY_OPTIONS = ['Sedentary', 'Light', 'Moderate', 'Active']
const ALCOHOL_OPTIONS = ['None', 'Occasional', 'Regular']
const DURATION_OPTIONS = ['< 1 year', '1–5 years', '5+ years']
const CONTROL_OPTIONS = ['Well-controlled', 'Poorly controlled', 'Not sure']
const MEDICATION_OPTIONS = ['Yes', 'No']
const FAMILY_HISTORY_OPTIONS = ['Diabetes', 'Heart Disease', 'Cancer', 'Stroke']

const CONDITION_DEFS = [
  { key: 'diabetes', label: 'Diabetes', showControl: true },
  { key: 'hypertension', label: 'Hypertension', showControl: true },
  { key: 'highCholesterol', label: 'High Cholesterol', showControl: true },
  { key: 'heartDisease', label: 'Heart Disease', showControl: false },
]

// ── BMI helpers (Asian cut-offs per HPB) ──
function calcBMI(h, w) {
  const hm = parseFloat(h) / 100
  const wk = parseFloat(w)
  if (!hm || !wk || !isFinite(hm) || !isFinite(wk) || hm <= 0) return null
  return (wk / (hm * hm)).toFixed(1)
}

function bmiCategory(bmi) {
  const v = parseFloat(bmi)
  if (v < 18.5) return { label: 'Underweight', color: 'text-amber-500' }
  if (v < 23) return { label: 'Healthy', color: 'text-green-600' }
  if (v < 27.5) return { label: 'Overweight', color: 'text-amber-500' }
  return { label: 'Obese', color: 'text-red-500' }
}

// ── Cholesterol unit conversion (1 mmol/L = 38.67 mg/dL) ──
const CHOL_FACTOR = 38.67
function mgToMmol(mg) { return mg ? (parseFloat(mg) / CHOL_FACTOR).toFixed(2) : '' }
function mmolToMg(mmol) { return mmol ? (parseFloat(mmol) * CHOL_FACTOR).toFixed(0) : '' }

// ── System prompt builder ──
function getSystemPrompt(healthData, profile) {
  const { bmi, smoking, activity, alcohol, conditions, labs, familyHistory } = profile

  const hasLifestyle = bmi || smoking || activity || alcohol
  const activeConditions = Object.entries(conditions || {}).filter(([, v]) => v.selected)
  const hasLabs = Object.values(labs || {}).some(v => v)
  const hasFamilyHistory = (familyHistory || []).length > 0
  const hasClinical = activeConditions.length > 0 || hasLabs || hasFamilyHistory

  let paragraphInstructions
  if (hasClinical) {
    paragraphInstructions = `Cover in 4–5 short paragraphs:
1. **Where you stand:** What population data shows for their demographic — use specific numbers from the reference data
2. **Your body & lifestyle:** Compare their personal metrics (BMI, smoking, activity) against population averages for their demographic. Be specific.
3. **What to watch for:** Condition-specific guidance based on their diagnosed conditions, control status, and lab values. Reference clinical guidelines where relevant (e.g. HbA1c target <7% for diabetics per Singapore MOH guidelines, BP target <140/90 per Singapore MOH CPG).
4. **What you can do:** Actionable, tailored health behaviours and relevant screening (e.g. Screen for Life)
5. **Next steps:** A warm closing recommending they speak with their family doctor under Healthier SG`
  } else if (hasLifestyle) {
    paragraphInstructions = `Cover in 4 short paragraphs:
1. **Where you stand:** What population data shows for their demographic — use specific numbers
2. **Your body & lifestyle:** Compare their personal metrics against population averages. Be specific with comparisons.
3. **What you can do:** Actionable health behaviours and relevant screening (e.g. Screen for Life)
4. **Next steps:** A warm closing recommending they speak with their family doctor under Healthier SG`
  } else {
    paragraphInstructions = `Cover in 3 short paragraphs:
1. What the population data shows for their demographic regarding chronic disease risk factors — use specific numbers
2. One or two actionable health behaviours and relevant screening (e.g. Screen for Life)
3. A warm closing recommending they speak with their family doctor under Healthier SG`
  }

  let personalDataSection = ''
  if (hasLifestyle || hasClinical) {
    const lines = ['\nThe user has provided additional personal health data. Use it to make the insight more personal and specific:\n']

    if (bmi) lines.push(`- BMI: ${bmi} (Asian BMI cut-offs: <18.5 underweight, 18.5–22.9 healthy, 23–27.4 overweight, ≥27.5 obese). Compare against their demographic's obesity prevalence.`)
    if (smoking) lines.push(`- Smoking status: ${smoking}. Compare against Singapore's daily smoking rate for their demographic.`)
    if (activity) lines.push(`- Physical activity: ${activity}. Reference HPB's recommended 150 min/week moderate activity and the population's activity levels.`)
    if (alcohol) lines.push(`- Alcohol consumption: ${alcohol}.`)

    if (activeConditions.length > 0) {
      lines.push('\nDiagnosed conditions:')
      for (const [name, v] of activeConditions) {
        const parts = [`  - ${name}`]
        if (v.duration) parts.push(`Duration: ${v.duration}`)
        if (v.control) parts.push(`Control: ${v.control}`)
        if (v.medication != null) parts.push(`On medication: ${v.medication ? 'Yes' : 'No'}`)
        lines.push(parts.join(', '))
      }
      lines.push('Give guidance specific to their condition status — a well-controlled condition on medication is very different from newly diagnosed or poorly controlled.')
    }

    if (hasLabs) {
      const labParts = []
      if (labs.hba1c) labParts.push(`HbA1c: ${labs.hba1c}%`)
      if (labs.sysBP || labs.diaBP) labParts.push(`BP: ${labs.sysBP || '?'}/${labs.diaBP || '?'} mmHg`)
      if (labs.totalChol) labParts.push(`Total cholesterol: ${labs.totalChol} mmol/L`)
      if (labs.ldl) labParts.push(`LDL: ${labs.ldl} mmol/L`)
      lines.push(`\nLatest lab results: ${labParts.join(', ')}`)
      lines.push('Interpret these values against clinical guidelines and their demographic context. Note if values are within target or need attention.')
    }

    if (hasFamilyHistory) {
      lines.push(`\nFamily history of: ${familyHistory.join(', ')}. Factor this into risk assessment — family history is a significant non-modifiable risk factor.`)
    }

    personalDataSection = lines.join('\n')
  }

  return `You are a public health data interpreter for Singapore. Based on Singapore's National Population Health Survey data and MOH statistics, provide a brief, friendly, evidence-based narrative for a person with the given profile.

${paragraphInstructions}

Rules:
- Do NOT use markdown headers (#), bullet points, or emojis
- Start each paragraph with a severity tag and then a short bold label. The severity tag must be one of [GREEN], [AMBER], or [RED] placed before the bold label:
  - [GREEN] for positive findings, healthy metrics, or reassuring information
  - [AMBER] for areas to monitor, borderline values, or things to be aware of
  - [RED] for concerning findings that need attention or discussion with a doctor
  Example: [GREEN] **Where you stand:** Your demographic has seen...
  Example: [AMBER] **What to watch for:** Your LDL is slightly above...
- Write in flowing paragraphs after the bold label
- Tone: warm, conversational, empowering — not clinical or alarming
- Choose the severity based on the actual content of each paragraph, not a fixed pattern. A paragraph about lifestyle could be GREEN if the user is active, or AMBER if sedentary
- Always end by recommending they consult their doctor for personal medical advice
${personalDataSection}

Here is the reference data:
${JSON.stringify({
    diabetes_prevalence: healthData.diabetes_prevalence,
    hypertension_prevalence: healthData.hypertension_prevalence,
    obesity_prevalence: healthData.obesity_prevalence,
    high_cholesterol_prevalence: healthData.high_cholesterol_prevalence,
    chronic_disease_screening: healthData.chronic_disease_screening,
    life_expectancy: healthData.life_expectancy,
    cancer_incidence: { data: healthData.cancer_incidence?.data?.slice(-3) },
    daily_smoking_rate: healthData.daily_smoking_rate,
    physical_activity: healthData.physical_activity,
  })}`
}

// ── Sub-components ──

function PillSelector({ options, value, onChange, label, tooltip, small }) {
  return (
    <div>
      {label && (
        <div className="flex items-center mb-2">
          <label className="text-sm text-secondary font-body">{label}</label>
          {tooltip && <InfoTooltip content={tooltip} size={13} />}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-full font-body transition-all cursor-pointer ${
              value === opt
                ? 'bg-accent text-white'
                : 'bg-card text-secondary border border-border hover:border-accent'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function CollapsibleSection({ title, subtitle, isOpen, onToggle, children }) {
  return (
    <div className="border border-border rounded-xl">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-card rounded-xl hover:bg-grid/50 transition-colors cursor-pointer"
      >
        <div className="text-left">
          <span className="font-body font-semibold text-sm text-primary">{title}</span>
          {subtitle && <span className="block text-xs text-secondary mt-0.5">{subtitle}</span>}
        </div>
        <ChevronDown
          size={16}
          className={`text-secondary transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-2 space-y-5 border-t border-border">
          {children}
        </div>
      )}
    </div>
  )
}

function NumericInput({ label, value, onChange, unit, hint, tooltip, placeholder }) {
  return (
    <div>
      <div className="flex items-center mb-1.5">
        <label className="text-sm text-secondary font-body">{label}</label>
        {tooltip && <InfoTooltip content={tooltip} size={13} />}
      </div>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="bg-grid rounded-xl px-4 py-2.5 text-sm text-primary w-full focus:ring-2 focus:ring-accent/30 focus:outline-none font-body"
          placeholder={placeholder || '—'}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-secondary pointer-events-none">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-secondary/70 mt-1">{hint}</p>}
    </div>
  )
}

function ConditionCard({ def, condition, onChange }) {
  const isSelected = condition?.selected

  const update = (field, value) => {
    onChange({ ...condition, selected: true, [field]: value })
  }

  return (
    <div className={`border rounded-xl transition-colors ${isSelected ? 'border-accent bg-teal-50/50' : 'border-border'}`}>
      <label className="flex items-center gap-2.5 px-4 py-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!!isSelected}
          onChange={() => onChange({ ...condition, selected: !isSelected })}
          className="accent-accent"
        />
        <span className="text-sm text-primary font-body">{def.label}</span>
      </label>
      {isSelected && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <PillSelector
            label="How long have you had it?"
            options={DURATION_OPTIONS}
            value={condition?.duration}
            onChange={v => update('duration', v)}
            small
          />
          {def.showControl && (
            <PillSelector
              label="How well is it controlled?"
              options={CONTROL_OPTIONS}
              value={condition?.control}
              onChange={v => update('control', v)}
              small
            />
          )}
          <PillSelector
            label="On medication?"
            options={MEDICATION_OPTIONS}
            value={condition?.medication === true ? 'Yes' : condition?.medication === false ? 'No' : null}
            onChange={v => update('medication', v === 'Yes')}
            small
          />
        </div>
      )}
    </div>
  )
}

// ── Main Component ──

export default function PersonalInsight() {
  const [ref, isVisible] = useScrollAnimation(0.1)
  const { healthData } = useHealthData()

  // Tier 1 — Required
  const [age, setAge] = useState(null)
  const [gender, setGender] = useState(null)
  const [ethnicity, setEthnicity] = useState(null)

  // Tier 2 — Body & Lifestyle
  const [tier2Open, setTier2Open] = useState(false)
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [smoking, setSmoking] = useState(null)
  const [activity, setActivity] = useState(null)
  const [alcohol, setAlcohol] = useState(null)

  // Tier 3 — Clinical
  const [tier3Open, setTier3Open] = useState(false)
  const [conditions, setConditions] = useState({})
  const [labs, setLabs] = useState({ hba1c: '', sysBP: '', diaBP: '', totalChol: '', ldl: '' })
  const [cholUnit, setCholUnit] = useState('mmol/L') // 'mmol/L' or 'mg/dL'
  const [familyHistory, setFamilyHistory] = useState(new Set())

  // Generation state
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Computed
  const bmi = calcBMI(height, weight)
  const hasOptionalData = bmi || smoking || activity || alcohol ||
    Object.values(conditions).some(v => v.selected) ||
    Object.values(labs).some(v => v) ||
    familyHistory.size > 0
  const hasTier3Data = Object.values(conditions).some(v => v.selected) ||
    Object.values(labs).some(v => v) ||
    familyHistory.size > 0
  const canSubmit = age && gender && ethnicity && !loading

  const updateCondition = useCallback((key, value) => {
    setConditions(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateLab = useCallback((key, value) => {
    setLabs(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleFamilyHistory = useCallback((item) => {
    setFamilyHistory(prev => {
      const next = new Set(prev)
      next.has(item) ? next.delete(item) : next.add(item)
      return next
    })
  }, [])

  async function handleGenerate() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    setInsight(null)

    // Build profile for prompt
    const profile = {
      bmi,
      smoking,
      activity,
      alcohol,
      conditions,
      labs,
      familyHistory: [...familyHistory],
    }

    // Build enriched user message
    const parts = [
      `Generate a health insight for a ${gender} Singaporean aged ${age}, ethnicity: ${ethnicity}.`,
    ]
    if (bmi) parts.push(`BMI: ${bmi} (height ${height}cm, weight ${weight}kg).`)
    if (smoking) parts.push(`Smoking: ${smoking}.`)
    if (activity) parts.push(`Activity level: ${activity}.`)
    if (alcohol) parts.push(`Alcohol: ${alcohol}.`)

    const activeConditions = Object.entries(conditions).filter(([, v]) => v.selected)
    if (activeConditions.length > 0) {
      parts.push(`Diagnosed conditions: ${activeConditions.map(([name, v]) => {
        const detail = [name]
        if (v.duration) detail.push(v.duration)
        if (v.control) detail.push(v.control)
        if (v.medication != null) detail.push(v.medication ? 'on medication' : 'not on medication')
        return detail.join(' — ')
      }).join('; ')}.`)
    }

    const labParts = []
    if (labs.hba1c) labParts.push(`HbA1c ${labs.hba1c}%`)
    if (labs.sysBP || labs.diaBP) labParts.push(`BP ${labs.sysBP || '?'}/${labs.diaBP || '?'}`)
    if (labs.totalChol) labParts.push(`Total cholesterol ${labs.totalChol}`)
    if (labs.ldl) labParts.push(`LDL ${labs.ldl}`)
    if (labParts.length) parts.push(`Latest labs: ${labParts.join(', ')}.`)

    if (familyHistory.size > 0) parts.push(`Family history: ${[...familyHistory].join(', ')}.`)

    const maxTokens = hasTier3Data ? 1024 : hasOptionalData ? 768 : 512

    try {
      const result = await streamHealthSG(
        [{ role: 'user', content: parts.join(' ') }],
        getSystemPrompt(healthData, profile),
        maxTokens,
        (text) => setInsight(text)
      )
      setInsight(result)
    } catch (err) {
      setError(`Unable to generate insight: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Build expanded profile for report
  const reportProfile = {
    age, gender, ethnicity,
    ...(bmi && { bmi, height, weight }),
    ...(smoking && { smoking }),
    ...(activity && { activity }),
    ...(alcohol && { alcohol }),
    ...(Object.values(conditions).some(v => v.selected) && {
      conditions: Object.fromEntries(Object.entries(conditions).filter(([, v]) => v.selected))
    }),
    ...(Object.values(labs).some(v => v) && { labs }),
    ...(familyHistory.size > 0 && { familyHistory: [...familyHistory] }),
  }

  return (
    <section className="py-20 md:py-30 px-4 md:px-6" id="insight">
      <div className="max-w-[720px] mx-auto">
        <motion.div
          ref={ref}
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-heading text-3xl md:text-4xl text-primary">
            What Does This Mean For You?
          </h2>
          <p className="mt-2 text-secondary text-base">
            See what population health data says about your demographic.
            <InfoTooltip content="This uses AI to interpret Singapore's population health data for your profile. The more details you provide, the more personalised the insight. Your data stays in your browser and is never stored." />
          </p>
        </motion.div>

        <div className="mt-8 card p-6 md:p-8 space-y-6">
          {/* ── Tier 1: Required ── */}
          <PillSelector
            label="Age group"
            options={AGE_GROUPS}
            value={age}
            onChange={setAge}
            tooltip="Select the age range that includes your current age. Health risks vary significantly by age group."
          />
          <PillSelector
            label="Gender"
            options={GENDERS}
            value={gender}
            onChange={setGender}
            tooltip="Chronic disease prevalence differs between males and females. For example, diabetes rates tend to be higher among males in Singapore."
          />
          <PillSelector
            label="Ethnicity"
            options={ETHNICITIES}
            value={ethnicity}
            onChange={setEthnicity}
            tooltip="Health outcomes in Singapore vary across ethnic groups due to genetic, dietary, and lifestyle factors. For instance, diabetes prevalence is historically higher among Malay and Indian Singaporeans."
          />

          {/* ── Tier 2: Body & Lifestyle ── */}
          <CollapsibleSection
            title="Body & Lifestyle"
            subtitle="Helps compare your metrics against population averages"
            isOpen={tier2Open}
            onToggle={() => setTier2Open(v => !v)}
          >
            <p className="text-xs text-secondary/70 font-body italic">
              Fill in whatever you know — every bit helps, and you can skip the rest.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <NumericInput
                label="Height"
                value={height}
                onChange={setHeight}
                unit="cm"
                tooltip="Used with weight to calculate your BMI, which we compare against obesity data for your demographic."
                placeholder="e.g. 170"
              />
              <NumericInput
                label="Weight"
                value={weight}
                onChange={setWeight}
                unit="kg"
                tooltip="Used with height to calculate your BMI."
                placeholder="e.g. 70"
              />
            </div>

            {bmi && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-grid rounded-xl">
                <span className="text-sm text-secondary">Your BMI:</span>
                <span className={`text-sm font-semibold ${bmiCategory(bmi).color}`}>{bmi}</span>
                <span className="text-xs text-secondary">
                  ({bmiCategory(bmi).label} — Asian BMI cut-offs)
                </span>
              </div>
            )}

            <PillSelector
              label="Smoking status"
              options={SMOKING_OPTIONS}
              value={smoking}
              onChange={setSmoking}
              tooltip="Smoking is a major risk factor. Your status helps us contextualise against Singapore's smoking prevalence."
            />
            <PillSelector
              label="Physical activity"
              options={ACTIVITY_OPTIONS}
              value={activity}
              onChange={setActivity}
              tooltip="The Health Promotion Board (HPB) recommends 150 min/week of moderate activity. This helps us compare your activity level against population data."
            />
            <PillSelector
              label="Alcohol consumption"
              options={ALCOHOL_OPTIONS}
              value={alcohol}
              onChange={setAlcohol}
              tooltip="Alcohol use patterns affect health outcomes. This helps provide relevant guidance."
            />
          </CollapsibleSection>

          {/* ── Tier 3: Clinical Data ── */}
          <CollapsibleSection
            title="Clinical Data"
            subtitle="Conditions, lab results, and family history for a deeper insight"
            isOpen={tier3Open}
            onToggle={() => setTier3Open(v => !v)}
          >
            <p className="text-xs text-secondary/70 font-body italic">
              No need to remember everything — just fill in what you know. The more you share, the more personalised your insight.
            </p>
            <div>
              <p className="text-sm text-secondary mb-3 font-body">
                Select any conditions you've been diagnosed with
              </p>
              <div className="space-y-2">
                {CONDITION_DEFS.map(def => (
                  <ConditionCard
                    key={def.key}
                    def={def}
                    condition={conditions[def.key]}
                    onChange={v => updateCondition(def.key, v)}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center mb-3">
                <p className="text-sm text-secondary font-body">Latest lab results</p>
                <InfoTooltip content="If you know your latest numbers, enter them here. Lab values help the AI give more specific guidance. Skip any you don't know." size={13} />
              </div>
              <div className="space-y-4">
                {/* Row 1: HbA1c */}
                <div className="grid grid-cols-2 gap-4">
                  <NumericInput
                    label="HbA1c"
                    value={labs.hba1c}
                    onChange={v => updateLab('hba1c', v)}
                    unit="%"
                    hint="Normal: < 6.0%"
                  />
                </div>
                {/* Row 2: Blood pressure */}
                <div className="grid grid-cols-2 gap-4">
                  <NumericInput
                    label="Systolic BP"
                    value={labs.sysBP}
                    onChange={v => updateLab('sysBP', v)}
                    unit="mmHg"
                    hint="Normal: < 140 mmHg"
                  />
                  <NumericInput
                    label="Diastolic BP"
                    value={labs.diaBP}
                    onChange={v => updateLab('diaBP', v)}
                    unit="mmHg"
                    hint="Normal: < 90 mmHg"
                  />
                </div>
                {/* Row 3: Cholesterol with unit toggle */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-secondary font-body">Cholesterol unit:</span>
                  <button
                    onClick={() => setCholUnit(u => u === 'mmol/L' ? 'mg/dL' : 'mmol/L')}
                    className="text-xs font-body font-semibold px-2.5 py-1 rounded-full border border-accent text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                  >
                    {cholUnit}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <NumericInput
                    label="Total cholesterol"
                    value={cholUnit === 'mg/dL' ? (labs.totalChol ? mmolToMg(labs.totalChol) : '') : labs.totalChol}
                    onChange={v => updateLab('totalChol', cholUnit === 'mg/dL' ? mgToMmol(v) : v)}
                    unit={cholUnit}
                    hint={cholUnit === 'mg/dL' ? 'Optimal: < 200 mg/dL' : 'Optimal: < 5.2 mmol/L'}
                  />
                  <NumericInput
                    label="LDL cholesterol"
                    value={cholUnit === 'mg/dL' ? (labs.ldl ? mmolToMg(labs.ldl) : '') : labs.ldl}
                    onChange={v => updateLab('ldl', cholUnit === 'mg/dL' ? mgToMmol(v) : v)}
                    unit={cholUnit}
                    hint={cholUnit === 'mg/dL' ? 'Optimal: < 100 mg/dL' : 'Optimal: < 2.6 mmol/L'}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-3">
                <p className="text-sm text-secondary font-body">Family history</p>
                <InfoTooltip content="Family history of chronic disease is a significant risk factor. Select any conditions that run in your immediate family." size={13} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FAMILY_HISTORY_OPTIONS.map(opt => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors border font-body ${
                      familyHistory.has(opt)
                        ? 'border-accent bg-teal-50/50 text-primary'
                        : 'border-border text-secondary hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={familyHistory.has(opt)}
                      onChange={() => toggleFamilyHistory(opt)}
                      className="accent-accent"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* ── Privacy notice ── */}
          <p className="text-xs text-secondary/70 flex items-center gap-1.5 font-body">
            <Lock size={12} className="shrink-0" />
            Your data stays in your browser and is never stored or collected.
          </p>

          {/* ── Generate button ── */}
          <button
            onClick={handleGenerate}
            disabled={!canSubmit}
            className={`w-full py-3 rounded-xl font-body font-semibold text-white transition-all cursor-pointer ${
              canSubmit
                ? 'bg-accent hover:bg-accent/90'
                : 'bg-accent/40 cursor-not-allowed'
            }`}
          >
            {loading ? 'Generating...' : 'Generate My Insight'}
          </button>

          {canSubmit && !hasOptionalData && (
            <p className="text-xs text-secondary/60 text-center -mt-2 font-body">
              Add more details above for a deeper, more personalised insight.
            </p>
          )}
        </div>

        {/* ── Loading skeleton (only before first text arrives) ── */}
        {loading && !insight && (
          <div className="mt-6 card p-6 space-y-3 animate-pulse">
            <div className="h-3 bg-grid rounded w-1/3" />
            <div className="h-3 bg-grid rounded w-full" />
            <div className="h-3 bg-grid rounded w-5/6" />
            <div className="h-3 bg-grid rounded w-full" />
            <div className="h-3 bg-grid rounded w-2/3" />
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mt-6 card p-6 border border-danger/20">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {/* ── Insight result ── */}
        {insight && (
          <motion.div
            className="mt-6 card p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs text-secondary mb-4">
              AI-generated insight
              <InfoTooltip content="This narrative was generated by Claude AI based on Singapore's published population health data and the details you provided. It reflects population-level trends combined with your personal context — it is not a medical diagnosis. Always consult your doctor for personal health advice." />
            </p>
            <div className="prose prose-sm max-w-none text-primary leading-relaxed space-y-4">
              {renderMarkdownParagraphs(insight)}
            </div>
            {loading && (
              <span className="inline-block w-1.5 h-4 bg-accent/60 rounded-sm animate-pulse ml-1" />
            )}
            {!loading && (
              <>
                <p className="mt-6 text-xs text-secondary/70 border-t border-border pt-4">
                  This is population-level information combined with the details you provided, not personal medical advice. Please consult your doctor.
                </p>
                <div className="mt-4 flex justify-center">
                  <ReportButton profile={reportProfile} insight={insight} />
                </div>
              </>
            )}
          </motion.div>
        )}

      </div>
    </section>
  )
}
