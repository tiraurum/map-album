import React, { useState } from 'react'
import MapView from './components/MapView'
import CityPopup from './components/CityPopup'
import Sidebar from './components/Sidebar'
import cities from './data/cities.json'
import { useCityRecords } from './hooks/useCityRecords'

export default function App() {
  const { records, getRecord, saveRecord, isLoading } = useCityRecords()
  const [selectedCityId, setSelectedCityId] = useState(null)

  const handleCityClick = (cityId) => {
    setSelectedCityId(cityId)
  }

  const handleMarkVisited = async (cityId) => {
    await saveRecord(cityId, { visited: true })
  }

  const handleOpenDetail = (cityId) => {
    // Task 5 will implement city detail view
    console.log('Open detail view for:', cityId)
  }

  const handleClosePopup = () => {
    setSelectedCityId(null)
  }

  const visitedCities = Object.keys(records).filter(cityId => records[cityId]?.visited)
  const citiesMap = Object.fromEntries(cities.map(c => [c.id, c]))

  const selectedCity = selectedCityId
    ? cities.find(c => c.id === selectedCityId)
    : null
  const selectedRecord = selectedCityId
    ? getRecord(selectedCityId)
    : null

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex' }}>
      {isLoading ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a2e',
          color: '#e0e0e0',
        }}>
          <h1>加载中...</h1>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, position: 'relative' }}>
            <MapView
              cities={cities}
              records={records}
              onCityClick={handleCityClick}
            >
              {selectedCity && (
                <CityPopup
                  city={selectedCity}
                  record={selectedRecord}
                  onMarkVisited={handleMarkVisited}
                  onOpenDetail={handleOpenDetail}
                  onClose={handleClosePopup}
                />
              )}
            </MapView>
          </div>
          <Sidebar
            visitedCities={visitedCities}
            citiesMap={citiesMap}
            records={records}
            onCityClick={handleCityClick}
          />
        </>
      )}
    </div>
  )
}
