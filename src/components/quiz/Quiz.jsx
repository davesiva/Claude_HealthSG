import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb } from 'lucide-react'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'
import { useHealthData } from '../../context/HealthDataContext'
import QUIZ_QUESTIONS from '../../data/quiz-questions'
import QuizQuestion from './QuizQuestion'
import QuizReveal from './QuizReveal'
import QuizResults from './QuizResults'

export default function Quiz() {
  const [sectionRef, isVisible] = useScrollAnimation(0.1)
  const { healthData } = useHealthData()

  // Quiz state
  const [phase, setPhase] = useState('intro') // 'intro' | 'question' | 'reveal' | 'results'
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState(null)
  const [answers, setAnswers] = useState([])

  // Shuffle questions once per session, sampling across categories for variety
  const questions = useMemo(() => {
    const byCategory = {}
    QUIZ_QUESTIONS.forEach(q => {
      ;(byCategory[q.category] ||= []).push(q)
    })
    // Shuffle each category independently
    Object.values(byCategory).forEach(arr => arr.sort(() => Math.random() - 0.5))
    // Round-robin pick from categories to ensure a mix
    const categories = Object.keys(byCategory).sort(() => Math.random() - 0.5)
    const picked = []
    let ci = 0
    while (picked.length < 10) {
      const cat = categories[ci % categories.length]
      if (byCategory[cat].length) {
        picked.push(byCategory[cat].shift())
      }
      ci++
      // Safety: if all categories drained, break
      if (Object.values(byCategory).every(a => a.length === 0)) break
    }
    return picked.sort(() => Math.random() - 0.5) // final shuffle so categories aren't clustered
  }, [])

  const currentQuestion = questions[currentIndex]

  // Get chart data for the current question from healthData
  const chartData = useMemo(() => {
    if (!currentQuestion?.indicatorKey || !healthData) return null
    const indicator = healthData[currentQuestion.indicatorKey]
    return indicator?.data || null
  }, [currentQuestion, healthData])

  const score = answers.filter((a, i) => a === questions[i].correctIndex).length

  function handleStart() {
    setPhase('question')
    setCurrentIndex(0)
    setAnswers([])
  }

  function handleAnswer(answerIndex) {
    setUserAnswer(answerIndex)
    setAnswers(prev => [...prev, answerIndex])
    setPhase('reveal')
  }

  function handleNext() {
    if (currentIndex >= questions.length - 1) {
      setPhase('results')
    } else {
      setCurrentIndex(prev => prev + 1)
      setUserAnswer(null)
      setPhase('question')
    }
  }

  function handleRestart() {
    setPhase('intro')
    setCurrentIndex(0)
    setUserAnswer(null)
    setAnswers([])
  }

  // Progress dots
  const progressPct = phase === 'results'
    ? 100
    : ((currentIndex + (phase === 'reveal' ? 1 : 0)) / questions.length) * 100

  return (
    <section ref={sectionRef} className="relative py-20 md:py-28 bg-gradient-to-b from-white to-gray-50/50">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {/* Section header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-mono tracking-wide uppercase mb-4">
              <Lightbulb size={14} />
              Test Yourself
            </div>
            <h2 className="font-heading text-3xl md:text-5xl text-primary mb-3">
              Did You Know?
            </h2>
            <p className="text-secondary text-base md:text-lg max-w-2xl mx-auto">
              Think you know Singapore's health landscape? Most people get these wrong.
            </p>
          </div>

          {/* Progress bar (shown during quiz) */}
          {phase !== 'intro' && (
            <div className="max-w-xl mx-auto mb-8">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          )}

          {/* Content area */}
          <div className="min-h-[400px] flex items-start justify-center pt-4">
            <AnimatePresence mode="wait">
              {phase === 'intro' && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <p className="text-secondary mb-2 text-lg">
                    {questions.length} questions on Singapore's health data &amp; healthcare landscape.
                  </p>
                  <p className="text-secondary mb-8 text-sm">
                    No time limit. A fresh mix every time.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStart}
                    className="px-8 py-4 bg-accent text-white rounded-full font-semibold text-lg
                      hover:bg-teal-600 transition-colors duration-200 cursor-pointer
                      shadow-sm"
                  >
                    Start the Quiz
                  </motion.button>
                </motion.div>
              )}

              {phase === 'question' && currentQuestion && (
                <QuizQuestion
                  key={`q-${currentIndex}`}
                  question={currentQuestion}
                  onAnswer={handleAnswer}
                  questionNumber={currentIndex + 1}
                  totalQuestions={questions.length}
                />
              )}

              {phase === 'reveal' && currentQuestion && (
                <QuizReveal
                  key={`r-${currentIndex}`}
                  question={currentQuestion}
                  userAnswer={userAnswer}
                  chartData={chartData}
                  onNext={handleNext}
                  isLast={currentIndex >= questions.length - 1}
                />
              )}

              {phase === 'results' && (
                <QuizResults
                  key="results"
                  score={score}
                  total={questions.length}
                  onRestart={handleRestart}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
