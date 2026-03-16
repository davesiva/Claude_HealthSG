import { useState, useEffect, useRef } from 'react'

const SECTION_LABELS = [
  'At a Glance',
  'How We Got Here',
  'Explore the Data',
  'Insight Lab',
  'Singapore in the World',
  'Your Insights',
]

export default function ProgressBar({ sections, visible }) {
  const [activeIndex, setActiveIndex] = useState(0)
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

  if (!visible) return null

  // ══════════════════════════════════════════
  // Mobile: Horizontal bar at bottom
  // ══════════════════════════════════════════
  if (isMobile) {
    return (
      <div
        className="fixed z-30 flex items-center justify-center"
        style={{
          bottom: '14px',
          left: '16px',
          right: '16px',
          height: '32px',
          borderRadius: '20px',
          background: 'rgba(250, 250, 248, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex-1 flex items-center h-full relative" style={{ paddingLeft: '14px', paddingRight: '14px' }}>
          {/* Track line */}
          <div
            className="absolute top-1/2 left-0 right-0 -translate-y-1/2"
            style={{ height: '1.5px', backgroundColor: '#E5E7EB' }}
          />
          {/* Ticks */}
          <div className="relative w-full flex items-center justify-between">
            {SECTION_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => handleClick(i)}
                className="relative flex flex-col items-center group cursor-pointer"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                aria-label={`Go to ${label}`}
              >
                <div
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === activeIndex ? '10px' : '6px',
                    height: i === activeIndex ? '10px' : '6px',
                    backgroundColor: i === activeIndex ? '#0D9488' : '#D1D5DB',
                    boxShadow: i === activeIndex ? '0 0 0 3px rgba(13, 148, 136, 0.15)' : 'none',
                  }}
                />
              </button>
            ))}
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
