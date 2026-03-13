import { motion } from 'framer-motion'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import TimelineChapter, { chapters } from './TimelineChapter'

export default function Timeline() {
  const [ref, isVisible] = useScrollAnimation(0.1)

  return (
    <section className="py-20 md:py-30 px-6" id="timeline">
      <div className="max-w-[720px] mx-auto">
        <motion.div
          ref={ref}
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-heading text-3xl md:text-4xl text-primary">
            How We Got Here
          </h2>
          <p className="mt-2 text-secondary text-base">
            Six decades of Singapore's health transformation
          </p>
        </motion.div>

        {/* Timeline line */}
        <div className="relative">
          <div className="absolute left-1.5 top-0 bottom-0 w-px bg-accent/30" />
          {chapters.map((ch, i) => (
            <TimelineChapter key={i} chapter={ch} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
