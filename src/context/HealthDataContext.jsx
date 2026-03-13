import { createContext, useContext, useState, useEffect } from 'react'
import { fetchAllHealthData } from '../utils/fetchHealthData'
import fallbackData from '../data/health-indicators.json'

const HealthDataContext = createContext(null)

export function HealthDataProvider({ children }) {
  const [healthData, setHealthData] = useState(fallbackData)
  const [dataStatus, setDataStatus] = useState('loading') // 'loading' | 'live' | 'fallback'

  useEffect(() => {
    fetchAllHealthData().then(data => {
      setHealthData(data)
      const isLive = data._sources?.prevalence === 'live' || data._sources?.demographics === 'live'
      setDataStatus(isLive ? 'live' : 'fallback')
    })
  }, [])

  return (
    <HealthDataContext.Provider value={{ healthData, dataStatus }}>
      {children}
    </HealthDataContext.Provider>
  )
}

export function useHealthData() {
  const ctx = useContext(HealthDataContext)
  if (!ctx) throw new Error('useHealthData must be used within HealthDataProvider')
  return ctx
}
