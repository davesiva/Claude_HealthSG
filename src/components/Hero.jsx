import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useHealthData } from '../context/HealthDataContext'

function getLatest(indicator) {
  if (!indicator?.data?.length) return null
  return indicator.data[indicator.data.length - 1]
}

export default function Hero() {
  const { healthData } = useHealthData()
  const [currentStat, setCurrentStat] = useState(0)
  const [prefersReduced, setPrefersReduced] = useState(false)

  const stats = useMemo(() => {
    const le = getLatest(healthData.life_expectancy)
    const dm = getLatest(healthData.diabetes_prevalence)
    const ghe = getLatest(healthData.govt_health_expenditure)
    const sm = getLatest(healthData.daily_smoking_rate)

    return [
      { label: 'Life expectancy', value: le ? `${le.value} years` : '83.9 years' },
      { label: 'Diabetes prevalence', value: dm ? `${dm.value}% of adults` : '8.5% of adults' },
      { label: 'Govt health spend', value: ghe ? `$${ghe.value}B in ${ghe.year}` : '$16.2B in 2022' },
      { label: 'Smoking rate at historic low', value: sm ? `${sm.value}%` : '9.7%' }
    ]
  }, [healthData])

  useEffect(() => {
    setPrefersReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (prefersReduced) return
    const interval = setInterval(() => {
      setCurrentStat(prev => (prev + 1) % stats.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [prefersReduced, stats.length])

  const fadeIn = prefersReduced
    ? { initial: {}, animate: {}, transition: {} }
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
      <div className="text-center max-w-2xl mx-auto">
        <motion.h1
          className="font-heading text-5xl md:text-7xl text-primary tracking-tight"
          {...fadeIn}
          transition={{ duration: 0.6, delay: 0 }}
        >
          HealthSG
        </motion.h1>

        <motion.p
          className="mt-4 text-lg md:text-xl text-secondary font-body"
          {...fadeIn}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Singapore's health story, told through data.
        </motion.p>

        <motion.div
          className="mt-10 h-16 flex items-center justify-center"
          {...fadeIn}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStat}
              initial={prefersReduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReduced ? {} : { opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <span className="text-secondary text-sm font-body">
                {stats[currentStat].label}:
              </span>
              <span className="ml-2 text-2xl md:text-3xl font-mono font-semibold text-accent">
                {stats[currentStat].value}
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-8"
        {...fadeIn}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <motion.div
          animate={prefersReduced ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-6 h-6 text-secondary" />
        </motion.div>
      </motion.div>
    </section>
  )
}
