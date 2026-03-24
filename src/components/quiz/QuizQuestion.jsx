import { motion } from 'framer-motion'

export default function QuizQuestion({ question, onAnswer, questionNumber, totalQuestions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-xl mx-auto"
    >
      <p className="text-xs font-mono text-secondary mb-4 tracking-wide uppercase">
        Question {questionNumber} of {totalQuestions}
      </p>

      <h3 className="font-heading text-2xl md:text-3xl text-primary mb-8 leading-snug">
        {question.question}
      </h3>

      <div className="flex flex-col gap-3">
        {question.options.map((option, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAnswer(i)}
            className="w-full text-left px-5 py-4 rounded-xl border border-border
              bg-white hover:border-accent hover:bg-teal-50/50
              transition-colors duration-200 text-primary text-base md:text-lg
              cursor-pointer font-sans"
          >
            <span className="font-mono text-secondary text-sm mr-3">
              {String.fromCharCode(65 + i)}
            </span>
            {option}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
