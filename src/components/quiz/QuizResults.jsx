import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw } from 'lucide-react'
import { useCountUp } from '../../hooks/useCountUp'

function getVerdict(score, total) {
  const pct = score / total
  if (pct === 1) return { title: 'Perfect Score!', desc: 'You know Singapore\'s health landscape inside out.' }
  if (pct >= 0.75) return { title: 'Impressive!', desc: 'You clearly follow Singapore\'s health trends closely.' }
  if (pct >= 0.5) return { title: 'Not Bad!', desc: 'You know more than most — but some stats still surprised you.' }
  if (pct >= 0.25) return { title: 'Eye-Opening!', desc: 'Lots of surprising findings. You\'re not alone — most people get these wrong.' }
  return { title: 'Full of Surprises!', desc: 'Singapore\'s health data defies expectations. Now you know the real picture.' }
}

export default function QuizResults({ score, total, onRestart }) {
  const animatedScore = useCountUp(score, 1200, true)
  const verdict = getVerdict(score, total)

  // Persist best score
  useEffect(() => {
    const stored = localStorage.getItem('middleout_quiz_best')
    const best = stored ? parseInt(stored, 10) : 0
    if (score > best) {
      localStorage.setItem('middleout_quiz_best', String(score))
    }
  }, [score])

  const bestScore = (() => {
    const stored = localStorage.getItem('middleout_quiz_best')
    return stored ? Math.max(parseInt(stored, 10), score) : score
  })()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-xl mx-auto text-center"
    >
      {/* Trophy icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 text-accent mb-6"
      >
        <Trophy size={32} />
      </motion.div>

      {/* Score */}
      <h3 className="font-heading text-4xl md:text-5xl text-primary mb-2">
        {Math.round(animatedScore)}<span className="text-secondary text-2xl md:text-3xl"> / {total}</span>
      </h3>

      {/* Verdict */}
      <p className="font-heading text-xl text-accent mb-2">{verdict.title}</p>
      <p className="text-secondary text-base max-w-md mx-auto mb-6 leading-relaxed">
        {verdict.desc}
      </p>

      {/* Best score */}
      {bestScore > score && (
        <p className="text-xs font-mono text-secondary mb-6">
          Your best: {bestScore} / {total}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border
            text-primary hover:border-accent hover:text-accent transition-colors duration-200
            cursor-pointer font-semibold"
        >
          <RotateCcw size={16} />
          Try Again
        </motion.button>
      </div>
    </motion.div>
  )
}
