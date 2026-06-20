import React from 'react'
import MapView from './components/MapView'
import cities from './data/cities.json'
import { useCityRecords } from './hooks/useCityRecords'

export default function App() {
  const { records, isLoading } = useCityRecords()

  const handleCityClick = (cityId) => {
    console.log('City clicked:', cityId)
  }

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      {isLoading ? (
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a2e',
          color: '#e0e0e0',
        }}>
          <h1>加载中...</h1>
        </div>
      ) : (
        <MapView
          cities={cities}
          records={records}
          onCityClick={handleCityClick}
        />
      )}
    </div>
  )
}
