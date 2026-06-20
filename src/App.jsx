import { useState, useCallback } from 'react'
import cities from './data/cities.json'
import { useCityRecords } from './hooks/useCityRecords'
import MapView from './components/MapView'
import CityPopup from './components/CityPopup'
import Sidebar from './components/Sidebar'
import DetailPanel from './components/DetailPanel'

const citiesMap = Object.fromEntries(cities.map(c => [c.id, c]))
const visitedIds = (records) => Object.values(records)
  .filter(r => r.visited)
  .map(r => r.cityId)

export default function App() {
  const { records, getRecord, saveRecord, isLoading } = useCityRecords()
  const [selectedCityId, setSelectedCityId] = useState(null)
  const [detailCityId, setDetailCityId] = useState(null)

  const visitedCities = visitedIds(records)

  const handleCityClick = useCallback((cityId) => {
    setSelectedCityId(prev => prev === cityId ? null : cityId)
  }, [])

  const handleMarkVisited = useCallback(async (cityId) => {
    await saveRecord(cityId, { visited: true })
    setSelectedCityId(null)
  }, [saveRecord])

  const handleOpenDetail = useCallback((cityId) => {
    setDetailCityId(cityId)
    setSelectedCityId(null)
  }, [])

  const handleSave = useCallback(async (cityId, data) => {
    await saveRecord(cityId, data)
  }, [saveRecord])

  const handleCloseDetail = useCallback(() => {
    setDetailCityId(null)
  }, [])

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e',
        color: '#888',
      }}>
        加载中...
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: '#16213e',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #0f3460',
        flexShrink: 0,
      }}>
        <span style={{ color: '#e94560', fontWeight: 'bold', fontSize: '16px' }}>
          🌏 我的旅行地图
        </span>
        <div style={{ display: 'flex', gap: '20px', color: '#aaa', fontSize: '13px' }}>
          <span>已探索 <strong style={{ color: '#e94560' }}>{visitedCities.length}</strong>/{cities.length} 城</span>
          <span>照片 <strong style={{ color: '#f5c518' }}>
            {Object.values(records).reduce((sum, r) => sum + (r.photos?.length || 0), 0)}
          </strong> 张</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <MapView
            cities={cities}
            records={records}
            onCityClick={handleCityClick}
          >
            {selectedCityId && (
              <CityPopup
                key={selectedCityId}
                city={citiesMap[selectedCityId]}
                record={getRecord(selectedCityId)}
                onMarkVisited={handleMarkVisited}
                onOpenDetail={handleOpenDetail}
                onClose={() => setSelectedCityId(null)}
              />
            )}
          </MapView>
        </div>

        <Sidebar
          visitedCities={visitedCities}
          citiesMap={citiesMap}
          records={records}
          onCityClick={handleOpenDetail}
        />
      </div>

      {detailCityId && (
        <DetailPanel
          city={citiesMap[detailCityId]}
          record={getRecord(detailCityId)}
          onSave={handleSave}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  )
}
