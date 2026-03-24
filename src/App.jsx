import { useState, useRef, useCallback } from 'react'
import { HealthDataProvider } from './context/HealthDataContext'
import LiveBanner from './components/LiveBanner'
import HeroLensSection from './components/HeroLensSection'
import Timeline from './components/Timeline'
import Explorer from './components/Explorer'
import InsightLab from './components/InsightLab'
import GlobalComparisons from './components/GlobalComparisons'
import Quiz from './components/quiz/Quiz'
import PersonalInsight from './components/PersonalInsight'
import HealthMap from './components/HealthMap'
import AskHealthSG from './components/AskHealthSG'
import Footer from './components/Footer'
import SiteNav from './components/SiteNav'

function App() {
  const [selectedIndicator, setSelectedIndicator] = useState(null)
  const [heroSettled, setHeroSettled] = useState(false)

  // ── Section refs for progress bar ──
  const heroRef = useRef(null)
  const timelineRef = useRef(null)
  const explorerRef = useRef(null)
  const healthMapRef = useRef(null)
  const insightLabRef = useRef(null)
  const globalRef = useRef(null)
  const quizRef = useRef(null)
  const personalRef = useRef(null)

  const sections = [
    { id: 'glance', label: 'At a Glance', ref: heroRef },
    { id: 'timeline', label: 'How We Got Here', ref: timelineRef },
    { id: 'explorer', label: 'Explore the Data', ref: explorerRef },
    { id: 'health-map', label: 'Health Map', ref: healthMapRef },
    { id: 'insight-lab', label: 'Insight Lab', ref: insightLabRef },
    { id: 'global', label: 'Singapore in the World', ref: globalRef },
    { id: 'quiz', label: 'Test Yourself', ref: quizRef },
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
        <div ref={heroRef} style={{ scrollMarginTop: 56 }}>
          <HeroLensSection onSelectIndicator={handleSelectIndicator} onSettled={handleSettled} />
        </div>
        <div ref={timelineRef} style={{ scrollMarginTop: 56 }}>
          <Timeline />
        </div>
        <div ref={explorerRef} style={{ scrollMarginTop: 56 }}>
          <Explorer selectedIndicator={selectedIndicator} />
        </div>
        <div ref={healthMapRef} style={{ scrollMarginTop: 56 }}>
          <HealthMap />
        </div>
        <div ref={insightLabRef} style={{ scrollMarginTop: 56 }}>
          <InsightLab />
        </div>
        <div ref={globalRef} style={{ scrollMarginTop: 56 }}>
          <GlobalComparisons />
        </div>
        <div ref={quizRef} style={{ scrollMarginTop: 56 }}>
          <Quiz />
        </div>
        <div ref={personalRef} style={{ scrollMarginTop: 56 }}>
          <PersonalInsight />
        </div>
        <Footer />
        {/* <AskHealthSG /> — temporarily hidden */}
        <SiteNav sections={sections} visible={heroSettled} />
      </div>
    </HealthDataProvider>
  )
}

export default App
