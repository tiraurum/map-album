import { useState, useCallback, useRef, useMemo } from 'react'
import cities from './data/cities.json'
import { useCityRecords } from './hooks/useCityRecords'
import { useRoutes } from './hooks/useRoutes'
import { useAchievements } from './hooks/useAchievements'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import MapView from './components/MapView'
import CityPopup from './components/CityPopup'
import Sidebar from './components/Sidebar'
import DetailPanel from './components/DetailPanel'
import RouteLines from './components/RouteLines'
import StatisticsPanel from './components/StatisticsPanel'
import ThemeSwitcher from './components/ThemeSwitcher'
import AchievementToast from './components/AchievementToast'
import AchievementPanel from './components/AchievementPanel'

const citiesMap = Object.fromEntries(cities.map(c => [c.id, c]))

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

function AppContent() {
  const { theme, themeId } = useTheme()
  const { records, getRecord, saveRecord, deleteRecord, loadRecords, addTrip, updateTrip, removeTrip, isLoading } = useCityRecords()
  const { routes, createRoute, deleteRoute } = useRoutes()
  const { unlocked, locked, toastQueue, dismissToast, unlockedCount, totalCount } = useAchievements(records)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [detailRegionId, setDetailRegionId] = useState(null)
  const [filterYear, setFilterYear] = useState('')
  const [sortOrder, setSortOrder] = useState('default')
  const [showAchievements, setShowAchievements] = useState(false)
  const regionMeta = useRef({}) // code -> { name, level }

  // All cities with any status (visited / wanna-go / planned)
  const markedIds = Object.values(records).filter(r => r.visited).map(r => r.cityId)

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

  const handleMarkCity = useCallback(async (regionId, status) => {
    const name = selectedRegion?.name || String(regionId)
    await saveRecord(regionId, { visited: true, status, regionName: name })
    setSelectedRegion(null)
  }, [saveRecord, selectedRegion])

  const handleUpdateStatus = useCallback(async (regionId, newStatus) => {
    await saveRecord(regionId, { status: newStatus, visited: true })
    // Keep popup open so user sees the change
  }, [saveRecord])

  const handleUnmarkCity = useCallback(async (regionId) => {
    await deleteRecord(regionId)
    setSelectedRegion(null)
    setDetailRegionId(null)
  }, [deleteRecord])

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
        justifyContent: 'center', background: theme.bg, color: theme.textSecondary,
      }}>
        加载中...
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: theme.bg }}>
      <div style={{
        background: theme.surface, padding: '10px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${theme.border}`, flexShrink: 0,
      }}>
        <span style={{ color: theme.primary, fontWeight: 'bold', fontSize: '16px' }}>
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
                onMarkCity={handleMarkCity}
                onUpdateStatus={handleUpdateStatus}
                onUnmarkCity={handleUnmarkCity}
                onOpenDetail={handleOpenDetail}
                onClose={() => setSelectedRegion(null)}
              />
            )}
            <RouteLines routes={routes} citiesMap={citiesMap} />
          </MapView>

          {/* Bottom-left button group */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <button
              onClick={() => setShowAchievements(!showAchievements)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                color: theme.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: theme.shadow || 'none',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              title={`成就 (${unlockedCount}/${totalCount})`}
            >
              🏆
            </button>

            {showAchievements && (
              <AchievementPanel
                unlocked={unlocked}
                locked={locked}
                unlockedCount={unlockedCount}
                totalCount={totalCount}
                onClose={() => setShowAchievements(false)}
              />
            )}

            <ThemeSwitcher />

            <AchievementToast queue={toastQueue} onDismiss={dismissToast} />
          </div>
        </div>

        <Sidebar
          visitedCities={markedIds}
          citiesMap={citiesMap}
          records={records}
          onCityClick={handleOpenDetail}
          onImportDone={loadRecords}
          filterYear={filterYear}
          sortOrder={sortOrder}
          onFilterYearChange={setFilterYear}
          onSortChange={setSortOrder}
          routes={routes}
          onCreateRoute={createRoute}
          onDeleteRoute={deleteRoute}
        />
      </div>

      {detailCity && (
        <DetailPanel
          city={detailCity}
          record={getRecord(detailCity.id)}
          onSave={handleSave}
          onClose={handleCloseDetail}
          onUnmarkCity={handleUnmarkCity}
          onAddTrip={addTrip}
          onUpdateTrip={updateTrip}
          onRemoveTrip={removeTrip}
        />
      )}

      <StatisticsPanel records={records} />
    </div>
  )
}
