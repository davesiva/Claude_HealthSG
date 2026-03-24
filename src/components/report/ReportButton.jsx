import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileDown, X, Loader2 } from 'lucide-react'
import { useHealthData } from '../../context/HealthDataContext'
import { generateReport } from './ReportGenerator'

const INDICATOR_OPTIONS = [
  { key: 'life_expectancy', label: 'Life Expectancy' },
  { key: 'total_fertility_rate', label: 'Fertility Rate' },
  { key: 'diabetes_prevalence', label: 'Diabetes Prevalence' },
  { key: 'hypertension_prevalence', label: 'Hypertension' },
  { key: 'obesity_prevalence', label: 'Obesity' },
  { key: 'daily_smoking_rate', label: 'Smoking Rate' },
  { key: 'physical_activity', label: 'Physical Activity' },
  { key: 'aged_65_plus', label: 'Population Aged 65+' },
  { key: 'old_age_support_ratio', label: 'Support Ratio' },
  { key: 'govt_health_expenditure', label: 'Govt Health Spend' },
  { key: 'cancer_incidence', label: 'Cancer Incidence' },
  { key: 'childhood_obesity', label: 'Childhood Obesity' },
]

export default function ReportButton({ profile, insight }) {
  const { healthData } = useHealthData()
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(new Set(['life_expectancy', 'diabetes_prevalence', 'aged_65_plus']))
  const [generating, setGenerating] = useState(false)

  function toggleIndicator(key) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      await generateReport({
        healthData,
        profile,
        insight,
        selectedIndicators: Array.from(selected),
      })
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setGenerating(false)
      setIsOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border
          text-primary font-semibold text-sm hover:border-accent hover:text-accent
          transition-colors duration-200 cursor-pointer"
      >
        <FileDown size={16} />
        Download PDF Report
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} className="text-secondary" />
              </button>

              <h3 className="font-heading text-xl text-primary mb-2">
                Health Snapshot Report
              </h3>
              <p className="text-sm text-secondary mb-5">
                Choose which indicators to include in your PDF.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-6 max-h-60 overflow-y-auto">
                {INDICATOR_OPTIONS.map(opt => (
                  <label
                    key={opt.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer
                      transition-colors border
                      ${selected.has(opt.key)
                        ? 'border-accent bg-teal-50/50 text-primary'
                        : 'border-border text-secondary hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(opt.key)}
                      onChange={() => toggleIndicator(opt.key)}
                      className="accent-accent"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={selected.size === 0 || generating}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5
                    bg-accent text-white rounded-full font-semibold text-sm
                    hover:bg-teal-600 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileDown size={16} />
                      Generate PDF ({selected.size} indicator{selected.size !== 1 ? 's' : ''})
                    </>
                  )}
                </button>
              </div>

              {insight && (
                <p className="mt-3 text-xs text-secondary text-center">
                  Your personal insight will be included in the report.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
