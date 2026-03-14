import { useState } from 'react'
import { motion } from 'framer-motion'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { askHealthSG } from '../utils/anthropic'
import { useHealthData } from '../context/HealthDataContext'
import InfoTooltip from './InfoTooltip'
import { renderMarkdownParagraphs } from '../utils/renderMarkdown'

const ageGroups = ['18-29', '30-39', '40-49', '50-59', '60-69', '70+']
const genders = ['Male', 'Female']
const ethnicities = ['Chinese', 'Malay', 'Indian', 'Others']

function getSystemPrompt(healthData) {
  return `You are a public health data interpreter for Singapore. Based on Singapore's National Population Health Survey data and MOH statistics, provide a brief, friendly, evidence-based narrative for a person with the given profile.

Cover:
1. What the population data shows for their demographic regarding key chronic disease risk factors (diabetes, hypertension, hyperlipidaemia, obesity)
2. How these risks typically change as they age (based on age-stratified data)
3. One or two actionable, evidence-based health behaviours relevant to their profile
4. A brief note on relevant screening recommendations (e.g. Screen for Life programme)

Tone: Warm, conversational, empowering — not clinical or alarming. Use specific numbers from the data where available. Keep it to 4-5 paragraphs max. Always end by recommending they speak with their family doctor for personalised advice, especially under Healthier SG.

Here is the reference data:
${JSON.stringify(healthData, null, 2)}`
}

function PillSelector({ options, value, onChange, label, tooltip }) {
  return (
    <div>
      <div className="flex items-center mb-2">
        <label className="text-sm text-secondary font-body">{label}</label>
        {tooltip && <InfoTooltip content={tooltip} size={13} />}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-full text-sm font-body transition-all cursor-pointer ${
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

export default function PersonalInsight() {
  const [ref, isVisible] = useScrollAnimation(0.1)
  const { healthData } = useHealthData()
  const [age, setAge] = useState(null)
  const [gender, setGender] = useState(null)
  const [ethnicity, setEthnicity] = useState(null)
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const canSubmit = age && gender && ethnicity && !loading

  async function handleGenerate() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    setInsight(null)

    try {
      const result = await askHealthSG(
        [{
          role: 'user',
          content: `Generate a health insight for a ${gender} Singaporean aged ${age}, ethnicity: ${ethnicity}.`
        }],
        getSystemPrompt(healthData)
      )
      setInsight(result)
    } catch (err) {
      setError(`Unable to generate insight: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-20 md:py-30 px-6" id="insight">
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
            <InfoTooltip content="This uses AI to interpret Singapore's population health data for your age, gender, and ethnic group. The insight is based on published NPHS survey data — it is not personalised medical advice." />
          </p>
        </motion.div>

        <div className="mt-8 card p-6 md:p-8 space-y-6">
          <PillSelector
            label="Age group"
            options={ageGroups}
            value={age}
            onChange={setAge}
            tooltip="Select the age range that includes your current age. Health risks vary significantly by age group."
          />
          <PillSelector
            label="Gender"
            options={genders}
            value={gender}
            onChange={setGender}
            tooltip="Chronic disease prevalence differs between males and females. For example, diabetes rates tend to be higher among males in Singapore."
          />
          <PillSelector
            label="Ethnicity"
            options={ethnicities}
            value={ethnicity}
            onChange={setEthnicity}
            tooltip="Health outcomes in Singapore vary across ethnic groups due to genetic, dietary, and lifestyle factors. For instance, diabetes prevalence is historically higher among Malay and Indian Singaporeans."
          />

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
        </div>

        {loading && (
          <div className="mt-6 card p-6 space-y-3 animate-pulse">
            <div className="h-3 bg-grid rounded w-1/3" />
            <div className="h-3 bg-grid rounded w-full" />
            <div className="h-3 bg-grid rounded w-5/6" />
            <div className="h-3 bg-grid rounded w-full" />
            <div className="h-3 bg-grid rounded w-2/3" />
          </div>
        )}

        {error && (
          <div className="mt-6 card p-6 border border-danger/20">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {insight && (
          <motion.div
            className="mt-6 card p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs text-secondary mb-4">
              AI-generated insight
              <InfoTooltip content="This narrative was generated by Claude AI based on Singapore's published population health data. It reflects population-level trends, not individual risk. Always consult your doctor for personal health advice." />
            </p>
            <div className="prose prose-sm max-w-none text-primary leading-relaxed space-y-4">
              {renderMarkdownParagraphs(insight)}
            </div>
            <p className="mt-6 text-xs text-secondary/70 border-t border-border pt-4">
              This is population-level information, not personal medical advice. Please consult your doctor.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  )
}
