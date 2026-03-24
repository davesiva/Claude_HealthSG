import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Clock, BarChart3, MapPin, Sparkles, Globe, Lightbulb, User } from 'lucide-react'
import useScrollSpy from '../hooks/useScrollSpy'

// ── Desktop: 8 individual nav items ──
const DESKTOP_ITEMS = [
  { label: 'At a Glance', icon: Eye },
  { label: 'Timeline', icon: Clock },
  { label: 'Explorer', icon: BarChart3 },
  { label: 'Health Map', icon: MapPin },
  { label: 'Insight Lab', icon: Sparkles },
  { label: 'Global', icon: Globe },
  { label: 'Quiz', icon: Lightbulb },
  { label: 'You', icon: User },
]

// ── Mobile: 5 grouped tabs ──
const MOBILE_TABS = [
  { label: 'Home', icon: Eye, sectionIndices: [0] },
  { label: 'Story', icon: Clock, sectionIndices: [1] },
  { label: 'Data', icon: BarChart3, sectionIndices: [2, 3] },
  { label: 'Insights', icon: Sparkles, sectionIndices: [4, 5] },
  { label: 'You', icon: User, sectionIndices: [6, 7] },
]

const GLASS = {
  background: 'rgba(250, 250, 248, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}

// ── Desktop Nav Bar ──
function DesktopNavBar({ sections, activeIndex }) {
  const handleClick = (index) => {
    sections[index]?.ref?.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        height: 48,
        ...GLASS,
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          padding: '0 16px',
        }}
      >
        {DESKTOP_ITEMS.map((item, i) => {
          const isActive = i === activeIndex
          const Icon = item.icon
          return (
            <button
              key={item.label}
              onClick={() => handleClick(i)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 500,
                color: isActive ? '#0D9488' : '#6B7280',
                transition: 'color 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = '#1A1A1A'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = '#6B7280'
              }}
            >
              <Icon size={14} strokeWidth={2} />
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="nav-underline"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 8,
                    right: 8,
                    height: 2,
                    borderRadius: 1,
                    background: '#0D9488',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </motion.nav>
  )
}

// ── Mobile Tab Bar ──
function MobileTabBar({ sections, activeIndex }) {
  const lastTapRef = useRef({ tabIndex: -1, time: 0 })

  // Map activeIndex to the tab that owns it
  const activeTab = MOBILE_TABS.findIndex(tab =>
    tab.sectionIndices.includes(activeIndex)
  )

  const handleTap = useCallback((tabIndex) => {
    const tab = MOBILE_TABS[tabIndex]
    const now = Date.now()
    const last = lastTapRef.current

    // If tapping the already-active tab and it has multiple sections, cycle
    if (tabIndex === activeTab && tab.sectionIndices.length > 1) {
      const currentPos = tab.sectionIndices.indexOf(activeIndex)
      const nextPos = (currentPos + 1) % tab.sectionIndices.length
      const nextSectionIndex = tab.sectionIndices[nextPos]
      sections[nextSectionIndex]?.ref?.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      // Scroll to first section in the group
      const targetIndex = tab.sectionIndices[0]
      sections[targetIndex]?.ref?.current?.scrollIntoView({ behavior: 'smooth' })
    }

    lastTapRef.current = { tabIndex, time: now }
  }, [sections, activeIndex, activeTab])

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        ...GLASS,
        boxShadow: '0 -1px 8px rgba(0,0,0,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: 64,
        }}
      >
        {MOBILE_TABS.map((tab, i) => {
          const isActive = i === activeTab
          const Icon = tab.icon
          // Show dot indicator if tab has multiple sections and we're on the second one
          const hasMultiple = tab.sectionIndices.length > 1
          const subIndex = hasMultiple ? tab.sectionIndices.indexOf(activeIndex) : -1

          return (
            <button
              key={tab.label}
              onClick={() => handleTap(i)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '6px 12px',
                minWidth: 56,
                color: isActive ? '#0D9488' : '#9CA3AF',
                transition: 'color 0.2s',
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 10,
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                {tab.label}
              </span>
              {/* Sub-section dots for grouped tabs */}
              {hasMultiple && isActive && (
                <div style={{ display: 'flex', gap: 3, marginTop: 1 }}>
                  {tab.sectionIndices.map((_, di) => (
                    <div
                      key={di}
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: di === subIndex ? '#0D9488' : '#D1D5DB',
                        transition: 'background 0.2s',
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </motion.nav>
  )
}

// ── Main SiteNav ──
export default function SiteNav({ sections, visible }) {
  const [isMobile, setIsMobile] = useState(false)
  const activeIndex = useScrollSpy(sections)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        isMobile
          ? <MobileTabBar key="mobile-tab-bar" sections={sections} activeIndex={activeIndex} />
          : <DesktopNavBar key="desktop-nav-bar" sections={sections} activeIndex={activeIndex} />
      )}
    </AnimatePresence>
  )
}
