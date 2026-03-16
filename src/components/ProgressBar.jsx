import { useState, useEffect, useRef, useMemo } from 'react'

const SECTION_LABELS = [
  'At a Glance',
  'How We Got Here',
  'Explore the Data',
  'Insight Lab',
  'Singapore in the World',
  'Your Insights',
]

const TOTAL_SECTIONS = SECTION_LABELS.length
const TICKS_PER_SECTION = 5 // small ticks between each major tick
const TOTAL_TICKS = (TOTAL_SECTIONS - 1) * TICKS_PER_SECTION + TOTAL_SECTIONS

export default function ProgressBar({ sections, visible }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const observerRefs = useRef([])

  // ── Media query ──
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ── Scroll progress for mobile ruler ──
  useEffect(() => {
    if (!isMobile) return
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        setScrollProgress(Math.min(scrollTop / docHeight, 1))
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMobile])

  // ── IntersectionObserver to detect active section ──
  useEffect(() => {
    if (!sections?.length) return

    const observers = []
    const visibleSections = new Set()

    sections.forEach((section, index) => {
      const el = section.ref?.current
      if (!el) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            visibleSections.add(index)
          } else {
            visibleSections.delete(index)
          }
          // Active = the smallest index currently visible
          if (visibleSections.size > 0) {
            setActiveIndex(Math.min(...visibleSections))
          }
        },
        {
          rootMargin: '-40% 0px -40% 0px',
          threshold: 0,
        }
      )

      observer.observe(el)
      observers.push(observer)
      observerRefs.current[index] = observer
    })

    return () => {
      observers.forEach(obs => obs.disconnect())
    }
  }, [sections])

  // ── Click handler: scroll to section ──
  const handleClick = (index) => {
    const el = sections[index]?.ref?.current
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // ── Build tick marks for ruler ──
  const ticks = useMemo(() => {
    const result = []
    for (let s = 0; s < TOTAL_SECTIONS; s++) {
      // Major tick for section
      result.push({ type: 'major', sectionIndex: s })
      // Small ticks between sections (except after last)
      if (s < TOTAL_SECTIONS - 1) {
        for (let t = 0; t < TICKS_PER_SECTION; t++) {
          result.push({ type: 'minor' })
        }
      }
    }
    return result
  }, [])

  if (!visible) return null

  // ══════════════════════════════════════════
  // Mobile: Floating ruler progress bar
  // ══════════════════════════════════════════
  if (isMobile) {
    // Progress indicator position (percentage across the ruler)
    const progressPct = scrollProgress * 100

    return (
      <div
        className="fixed z-30"
        style={{
          bottom: '14px',
          left: '16px',
          right: '16px',
          height: '28px',
          borderRadius: '14px',
          background: 'rgba(250, 250, 248, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      >
        {/* Inner ruler area */}
        <div className="relative w-full h-full" style={{ padding: '0 14px' }}>
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 h-full transition-[width] duration-150 ease-out"
            style={{
              width: `calc(14px + (100% - 28px) * ${scrollProgress})`,
              borderRadius: '14px',
              background: 'linear-gradient(90deg, rgba(13,148,136,0.08) 0%, rgba(13,148,136,0.12) 100%)',
            }}
          />

          {/* Tick marks */}
          <div className="relative flex items-end justify-between h-full" style={{ paddingBottom: '5px' }}>
            {ticks.map((tick, i) => {
              const tickPct = i / (ticks.length - 1)
              const isPast = tickPct <= scrollProgress
              const isActive = tick.type === 'major' && tick.sectionIndex === activeIndex

              if (tick.type === 'major') {
                return (
                  <button
                    key={i}
                    onClick={() => handleClick(tick.sectionIndex)}
                    className="relative flex flex-col items-center cursor-pointer"
                    style={{ WebkitTapHighlightColor: 'transparent', width: '2px' }}
                    aria-label={`Go to ${SECTION_LABELS[tick.sectionIndex]}`}
                  >
                    <div
                      className="transition-all duration-300"
                      style={{
                        width: isActive ? '2.5px' : '2px',
                        height: isActive ? '14px' : '11px',
                        borderRadius: '1px',
                        backgroundColor: isActive ? '#0D9488' : isPast ? '#0D9488' : '#D1D5DB',
                        opacity: isActive ? 1 : isPast ? 0.7 : 0.5,
                      }}
                    />
                    {/* Active indicator dot */}
                    {isActive && (
                      <div
                        className="absolute -top-0.5"
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          backgroundColor: '#0D9488',
                          boxShadow: '0 0 0 2px rgba(13,148,136,0.2)',
                        }}
                      />
                    )}
                  </button>
                )
              }

              // Minor tick
              return (
                <div
                  key={i}
                  className="transition-colors duration-200"
                  style={{
                    width: '1px',
                    height: '6px',
                    borderRadius: '0.5px',
                    backgroundColor: isPast ? '#0D9488' : '#E5E7EB',
                    opacity: isPast ? 0.5 : 0.4,
                  }}
                />
              )
            })}
          </div>

        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════
  // Desktop: Vertical bar on right edge
  // ══════════════════════════════════════════
  return (
    <div
      className="fixed z-30 flex flex-col items-center"
      style={{
        right: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
      }}
    >
      {/* Track line */}
      <div
        className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2"
        style={{ width: '1.5px', backgroundColor: '#E5E7EB' }}
      />
      {/* Ticks */}
      <div className="relative flex flex-col items-center" style={{ gap: '28px' }}>
        {SECTION_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="relative flex items-center group cursor-pointer"
            aria-label={`Go to ${label}`}
          >
            {/* Dot */}
            <div
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? '10px' : '6px',
                height: i === activeIndex ? '10px' : '6px',
                backgroundColor: i === activeIndex ? '#0D9488' : '#D1D5DB',
                boxShadow: i === activeIndex ? '0 0 0 3px rgba(13, 148, 136, 0.15)' : 'none',
              }}
            />
            {/* Label on hover */}
            <span
              className="absolute right-full mr-3 whitespace-nowrap text-xs font-body opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{ color: i === activeIndex ? '#0D9488' : '#6B7280' }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
