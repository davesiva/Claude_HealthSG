import { useState, useRef } from 'react'
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

function App() {
  const [selectedIndicator, setSelectedIndicator] = useState(null)
  const explorerRef = useRef(null)

  function handleSelectIndicator(key) {
    setSelectedIndicator(key)
    explorerRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <HealthDataProvider>
      <div className="relative z-10 min-h-screen">
        <LiveBanner />
        <HeroLensSection onSelectIndicator={handleSelectIndicator} />
        <Timeline />
        <div ref={explorerRef}>
          <Explorer selectedIndicator={selectedIndicator} />
        </div>
        <InsightLab />
        <GlobalComparisons />
        <PersonalInsight />
        <Footer />
        <AskHealthSG />
      </div>
    </HealthDataProvider>
  )
}

export default App
