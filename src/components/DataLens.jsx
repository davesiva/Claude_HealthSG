import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const RINGS = [
  { id: 'longevity', label: 'Longevity', r: 50, strokeWidth: 4, color: '#0D9488' },
  { id: 'chronic', label: 'Chronic Disease', r: 105, strokeWidth: 3.5, color: '#EF4444' },
  { id: 'lifestyle', label: 'Lifestyle', r: 155, strokeWidth: 3, color: '#F59E0B' },
  { id: 'demographics', label: 'Demographics', r: 200, strokeWidth: 2.5, color: '#6366F1' },
  { id: 'healthcare', label: 'Healthcare', r: 245, strokeWidth: 2, color: '#8B5CF6' },
]

// Annotation label positions (desktop: right side of lens)
const ANNOTATIONS_DESKTOP = [
  { ringIdx: 4, lx: 580, ly: 140 },
  { ringIdx: 3, lx: 580, ly: 210 },
  { ringIdx: 2, lx: 580, ly: 280 },
  { ringIdx: 1, lx: 580, ly: 350 },
  { ringIdx: 0, lx: 580, ly: 420 },
]

// Tick marks at 8 positions on the outer ring
const TICK_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

export default function DataLens() {
  const containerRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    setPrefersReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  // ── Phase 1: 3D Tilt (0.10 → 0.30) ──
  const tiltMax = isMobile ? -10 : -20
  const tiltYMax = isMobile ? 6 : 12
  const rotateX = useTransform(scrollYProgress, [0.10, 0.25, 0.75, 0.92], [0, tiltMax, tiltMax, 0])
  const rotateY = useTransform(scrollYProgress, [0.10, 0.25, 0.75, 0.92], [0, tiltYMax, tiltYMax, 0])
  const shadowOpacity = useTransform(scrollYProgress, [0.10, 0.25, 0.75, 0.92], [0, 0.15, 0.15, 0])

  // ── Phase 2: Explode rings (0.30 → 0.55) + Phase 4 collapse (0.75 → 0.90) ──
  const explodeScale = isMobile ? 0.6 : 1
  const ringOffsets = RINGS.map((_, i) => {
    const maxOffset = -i * 35 * explodeScale
    return useTransform(scrollYProgress, [0.30, 0.50, 0.75, 0.88], [0, maxOffset, maxOffset, 0])
  })
  const ringOpacities = RINGS.map((_, i) => {
    return useTransform(scrollYProgress, [0.30, 0.50], [0.5, 0.8 + i * 0.04])
  })

  // ── Phase 3: Annotations (0.55 → 0.75) ──
  const LINE_LENGTH = 120
  const annotationDraws = ANNOTATIONS_DESKTOP.map((_, i) => {
    const start = 0.55 + i * 0.035
    const end = start + 0.06
    return useTransform(scrollYProgress, [start, end], [LINE_LENGTH, 0])
  })
  const annotationOpacities = ANNOTATIONS_DESKTOP.map((_, i) => {
    const start = 0.58 + i * 0.035
    const end = start + 0.04
    return useTransform(scrollYProgress, [start, end], [0, 1])
  })
  // Fade annotations out in phase 4
  const annotationGroupOpacity = useTransform(scrollYProgress, [0.75, 0.85], [1, 0])

  // ── Phase 4: Lens fade out (0.88 → 1.0) ──
  const lensScale = useTransform(scrollYProgress, [0.88, 1.0], [1, 0.85])
  const lensOpacity = useTransform(scrollYProgress, [0.90, 1.0], [1, 0])

  if (prefersReduced) {
    // Static fallback: just show flat rings with labels, no scroll animation
    return (
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-[500px] mx-auto">
          <svg viewBox="0 0 780 600" className="w-full">
            {RINGS.map(ring => (
              <circle
                key={ring.id}
                cx={300} cy={300} r={ring.r}
                fill="none"
                stroke={ring.color}
                strokeWidth={ring.strokeWidth}
                strokeOpacity={0.7}
              />
            ))}
            <circle cx={300} cy={300} r={6} fill="#0D9488" fillOpacity={0.4} />
            {ANNOTATIONS_DESKTOP.map(({ ringIdx, lx, ly }) => {
              const ring = RINGS[ringIdx]
              return (
                <g key={ringIdx}>
                  <line
                    x1={300 + ring.r} y1={300}
                    x2={lx} y2={ly}
                    stroke={ring.color} strokeWidth={1} strokeOpacity={0.4}
                    strokeDasharray="4 3"
                  />
                  <text x={lx + 8} y={ly + 4} fill={ring.color} fontSize={12} fontFamily="JetBrains Mono, monospace">
                    {ring.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={containerRef}
      style={{ height: '300vh' }}
      className="relative"
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden"
        style={{ perspective: '1000px' }}
      >
        {/* 3D tilt wrapper */}
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
            scale: lensScale,
            opacity: lensOpacity,
          }}
          className="relative"
        >
          {/* Shadow beneath the lens */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full pointer-events-none"
            style={{
              width: isMobile ? 260 : 420,
              height: 40,
              marginTop: isMobile ? 140 : 200,
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%)',
              opacity: shadowOpacity,
              filter: 'blur(10px)',
            }}
          />

          <svg
            viewBox={isMobile ? '50 50 500 500' : '0 0 780 600'}
            fill="none"
            className={isMobile ? 'w-[320px] h-[320px]' : 'w-[650px]'}
            style={{ maxHeight: '80vh' }}
          >
            {/* Crosshair lines */}
            <line x1={300} y1={40} x2={300} y2={140} stroke="#0D9488" strokeWidth={1} strokeOpacity={0.25} />
            <line x1={300} y1={460} x2={300} y2={560} stroke="#0D9488" strokeWidth={1} strokeOpacity={0.25} />
            <line x1={40} y1={300} x2={140} y2={300} stroke="#0D9488" strokeWidth={1} strokeOpacity={0.25} />
            <line x1={460} y1={300} x2={560} y2={300} stroke="#0D9488" strokeWidth={1} strokeOpacity={0.25} />

            {/* Center focal point */}
            <circle cx={300} cy={300} r={6} fill="#0D9488" fillOpacity={0.3} />
            <circle cx={300} cy={300} r={2} fill="#0D9488" fillOpacity={0.6} />

            {/* Tick marks on outer ring */}
            {TICK_ANGLES.map(angle => {
              const rad = (angle * Math.PI) / 180
              const outerR = RINGS[4].r
              const x1 = 300 + (outerR - 4) * Math.cos(rad)
              const y1 = 300 + (outerR - 4) * Math.sin(rad)
              const x2 = 300 + (outerR + 1) * Math.cos(rad)
              const y2 = 300 + (outerR + 1) * Math.sin(rad)
              return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8B5CF6" strokeWidth={1.5} strokeOpacity={0.35} />
            })}

            {/* Concentric rings with annotations — each in a motion.g for explode animation */}
            {RINGS.map((ring, i) => {
              // Find annotation for this ring
              const annotIdx = ANNOTATIONS_DESKTOP.findIndex(a => a.ringIdx === i)
              const annot = annotIdx >= 0 ? ANNOTATIONS_DESKTOP[annotIdx] : null
              return (
                <motion.g
                  key={ring.id}
                  style={{ translateY: ringOffsets[i] }}
                >
                  <motion.circle
                    cx={300} cy={300} r={ring.r}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={ring.strokeWidth}
                    style={{ strokeOpacity: ringOpacities[i] }}
                  />
                  {annot && (
                    <motion.g style={{ opacity: annotationGroupOpacity }}>
                      <motion.line
                        x1={300 + ring.r} y1={300}
                        x2={annot.lx} y2={annot.ly}
                        stroke={ring.color}
                        strokeWidth={1}
                        strokeDasharray={LINE_LENGTH}
                        style={{ strokeDashoffset: annotationDraws[annotIdx] }}
                        strokeOpacity={0.8}
                      />
                      <motion.text
                        x={annot.lx + 8}
                        y={annot.ly + 4}
                        fill={ring.color}
                        fontSize={isMobile ? 10 : 12}
                        fontFamily="JetBrains Mono, monospace"
                        style={{ opacity: annotationOpacities[annotIdx] }}
                      >
                        {ring.label}
                      </motion.text>
                    </motion.g>
                  )}
                </motion.g>
              )
            })}
          </svg>
        </motion.div>
      </div>
    </section>
  )
}
