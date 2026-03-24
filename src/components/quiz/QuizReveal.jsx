import { motion } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'
import QuizMiniChart from './QuizMiniChart'

export default function QuizReveal({ question, userAnswer, chartData, onNext, isLast }) {
  const isCorrect = userAnswer === question.correctIndex

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-xl mx-auto"
    >
      {/* Correct / Incorrect badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6
        ${isCorrect ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-700'}`}
      >
        {isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
        {isCorrect ? 'Correct!' : 'Not quite'}
      </div>

      {/* The correct answer highlighted */}
      <div className="mb-4">
        <p className="text-sm text-secondary mb-1">The answer is:</p>
        <p className="font-heading text-2xl text-primary">
          {question.options[question.correctIndex]}
        </p>
      </div>

      {/* Explanation */}
      <p className="text-secondary text-base leading-relaxed mb-2">
        {question.explanation}
      </p>

      {/* Mini chart */}
      {chartData && question.chartType !== 'none' && (
        <QuizMiniChart data={chartData} chartType={question.chartType} />
      )}

      {/* Next button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNext}
        className="mt-6 px-6 py-3 bg-accent text-white rounded-full font-semibold
          hover:bg-teal-600 transition-colors duration-200 cursor-pointer"
      >
        {isLast ? 'See My Results' : 'Next Question'}
      </motion.button>
    </motion.div>
  )
}
