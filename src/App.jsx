import { useState, useRef, useCallback } from 'react'
import { HealthDataProvider } from './context/HealthDataContext'
import LiveBanner from './components/LiveBanner'
import HeroLensSection from './components/HeroLensSection'
import Timeline from './components/Timeline'
import Explorer from './components/Explorer'
import InsightLab from './components/InsightLab'
import GlobalComparisons from './components/GlobalComparisons'
import PersonalInsight from './components/PersonalInsight'
import AskHealthSG from './components/AskHealthSG'
import Footer from './components/Footer'
import ProgressBar from './components/ProgressBar'

function App() {
  const [selectedIndicator, setSelectedIndicator] = useState(null)
  const [heroSettled, setHeroSettled] = useState(false)

  // ── Section refs for progress bar ──
  const heroRef = useRef(null)
  const timelineRef = useRef(null)
  const explorerRef = useRef(null)
  const insightLabRef = useRef(null)
  const globalRef = useRef(null)
  const personalRef = useRef(null)

  const sections = [
    { id: 'glance', label: 'At a Glance', ref: heroRef },
    { id: 'timeline', label: 'How We Got Here', ref: timelineRef },
    { id: 'explorer', label: 'Explore the Data', ref: explorerRef },
    { id: 'insight-lab', label: 'Insight Lab', ref: insightLabRef },
    { id: 'global', label: 'Singapore in the World', ref: globalRef },
    { id: 'personal', label: 'Your Insights', ref: personalRef },
  ]

  const handleSettled = useCallback((settled) => {
    setHeroSettled(settled)
  }, [])

  function handleSelectIndicator(key) {
    setSelectedIndicator(key)
    explorerRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <HealthDataProvider>
      <div className="relative z-10 min-h-screen">
        <LiveBanner />
        <div ref={heroRef}>
          <HeroLensSection onSelectIndicator={handleSelectIndicator} onSettled={handleSettled} />
        </div>
        <div ref={timelineRef}>
          <Timeline />
        </div>
        <div ref={explorerRef}>
          <Explorer selectedIndicator={selectedIndicator} />
        </div>
        <div ref={insightLabRef}>
          <InsightLab />
        </div>
        <div ref={globalRef}>
          <GlobalComparisons />
        </div>
        <div ref={personalRef}>
          <PersonalInsight />
        </div>
        <Footer />
        {/* <AskHealthSG /> — temporarily hidden */}
        <ProgressBar sections={sections} visible={heroSettled} />
      </div>
    </HealthDataProvider>
  )
}

export default App
