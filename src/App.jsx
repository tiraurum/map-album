import { useState, useCallback, useRef, useMemo } from 'react'
import cities from './data/cities.json'
import { useCityRecords } from './hooks/useCityRecords'
import MapView from './components/MapView'
import CityPopup from './components/CityPopup'
import Sidebar from './components/Sidebar'
import DetailPanel from './components/DetailPanel'

import StatisticsPanel from './components/StatisticsPanel'

const citiesMap = Object.fromEntries(cities.map(c => [c.id, c]))

export default function App() {
  const { records, getRecord, saveRecord, isLoading } = useCityRecords()
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [detailRegionId, setDetailRegionId] = useState(null)
  const regionMeta = useRef({}) // code -> { name, level }

  const visitedIds = Object.values(records).filter(r => r.visited).map(r => r.cityId)

  function handleRegionClick(region) {
    if (!region || !region.code) return
    const { code, name, level, lat, lng } = region
    if (lat == null || lng == null) return
    regionMeta.current[code] = { name, level }
    setSelectedRegion(prev => {
      if (prev?.code === code) return null
      const numId = Number(code)
      const known = citiesMap[numId]
      if (known) {
        return { id: numId, name: known.name, province: known.province, lat, lng, code }
      }
      return { id: code, name, province: level === 'province' ? name : '', lat, lng, code, level }
    })
  }

  const handleMarkVisited = useCallback(async (regionId) => {
    const name = selectedRegion?.name || String(regionId)
    await saveRecord(regionId, { visited: true, regionName: name })
    setSelectedRegion(null)
  }, [saveRecord, selectedRegion])

  const handleOpenDetail = useCallback((regionId) => {
    setDetailRegionId(regionId)
    setSelectedRegion(null)
  }, [])

  const handleSave = useCallback(async (regionId, data) => {
    await saveRecord(regionId, data)
  }, [saveRecord])

  const handleCloseDetail = useCallback(() => {
    setDetailRegionId(null)
  }, [])

  // Build city-like object for the popup from selectedRegion
  const popupCity = useMemo(() => {
    if (!selectedRegion) return null
    return {
      id: selectedRegion.id,
      name: selectedRegion.name,
      province: selectedRegion.province || '',
      lat: selectedRegion.lat,
      lng: selectedRegion.lng,
    }
  }, [selectedRegion])

  // Build city-like object for the detail panel (handles known cities + provinces/counties)
  const detailCity = useMemo(() => {
    if (!detailRegionId) return null
    const numId = Number(detailRegionId)
    if (citiesMap[numId]) return citiesMap[numId]
    const meta = regionMeta.current[detailRegionId]
    const regionName = records[detailRegionId]?.regionName
    const name = meta?.name || regionName || detailRegionId
    return {
      id: detailRegionId,
      name,
      province: meta?.level === 'province' ? name : '',
    }
  }, [detailRegionId, records])

  if (isLoading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#1a1a2e', color: '#888',
      }}>
        加载中...
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: '#16213e', padding: '10px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #0f3460', flexShrink: 0,
      }}>
        <span style={{ color: '#e94560', fontWeight: 'bold', fontSize: '16px' }}>
          🌏 我的旅行地图
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <MapView
            records={records}
            onRegionClick={handleRegionClick}
          >
            {popupCity && (
              <CityPopup
                key={popupCity.id}
                city={popupCity}
                record={getRecord(popupCity.id)}
                onMarkVisited={handleMarkVisited}
                onOpenDetail={handleOpenDetail}
                onClose={() => setSelectedRegion(null)}
              />
            )}
          </MapView>
        </div>

        <Sidebar
          visitedCities={visitedIds}
          citiesMap={citiesMap}
          records={records}
          onCityClick={handleOpenDetail}
        />
      </div>

      {detailCity && (
        <DetailPanel
          city={detailCity}
          record={getRecord(detailCity.id)}
          onSave={handleSave}
          onClose={handleCloseDetail}
        />
      )}

      <StatisticsPanel records={records} />
    </div>
  )
}
