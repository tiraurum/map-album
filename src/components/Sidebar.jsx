import { useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'
import CityCard from './CityCard'
import SidebarFilterBar from './SidebarFilterBar'
import DataBackup from './DataBackup'
import RouteManager from './RouteManager'

export default function Sidebar({
  visitedCities, citiesMap, records,
  onCityClick, onImportDone,
  filterYear, sortOrder, onFilterYearChange, onSortChange,
  routes, onCreateRoute, onDeleteRoute, onPlayRoute,
}) {
  const { theme } = useTheme()

  // Extract available years from visitDate in records
  const yearOptions = useMemo(() => {
    const years = new Set()
    years.add('')
    Object.values(records).forEach(r => {
      if (r?.visitDate) {
        const y = r.visitDate.slice(0, 4)
        if (y) years.add(y)
      }
    })
    return [...years].sort((a, b) => {
      if (a === '') return -1
      if (b === '') return 1
      return b.localeCompare(a)
    })
  }, [records])

  // Filter and sort
  const displayCities = useMemo(() => {
    let list = [...visitedCities]
    if (filterYear) {
      list = list.filter(id => {
        const r = records[id]
        return r?.visitDate?.startsWith(filterYear)
      })
    }
    if (sortOrder === 'date-asc') {
      list.sort((a, b) => {
        const da = records[a]?.visitDate || ''
        const db = records[b]?.visitDate || ''
        return da.localeCompare(db)
      })
    } else if (sortOrder === 'date-desc') {
      list.sort((a, b) => {
        const da = records[a]?.visitDate || ''
        const db = records[b]?.visitDate || ''
        return db.localeCompare(da)
      })
    } else {
      const statusOrder = { visited: 0, planned: 1, 'wanna-go': 2 }
      list.sort((a, b) => {
        const sa = statusOrder[records[a]?.status || 'visited']
        const sb = statusOrder[records[b]?.status || 'visited']
        return sa - sb
      })
    }
    return list
  }, [visitedCities, records, filterYear, sortOrder])

  const counts = { visited: 0, 'wanna-go': 0, planned: 0, filtered: displayCities.length }
  visitedCities.forEach(id => {
    const s = records[id]?.status || 'visited'
    if (counts[s] !== undefined) counts[s]++
  })

  return (
    <div style={{
      width: '240px',
      background: theme.surface,
      borderLeft: `1px solid ${theme.border}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{
        padding: '14px 14px 10px',
        color: theme.primary,
        fontWeight: 'bold',
        fontSize: '14px',
        borderBottom: `1px solid ${theme.border}`,
      }}>
        📍 我的足迹 ({filterYear ? displayCities.length + '/' : ''}{visitedCities.length})
        <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 'normal', marginTop: '4px', display: 'flex', gap: '10px' }}>
          <span>🔴 {counts.visited}</span>
          <span style={{ color: '#3b82f6' }}>🔵 {counts['wanna-go']}</span>
          <span style={{ color: '#10b981' }}>🟢 {counts.planned}</span>
        </div>
      </div>

      <SidebarFilterBar
        yearOptions={yearOptions}
        filterYear={filterYear}
        onFilterYearChange={onFilterYearChange}
        sortOrder={sortOrder}
        onSortChange={onSortChange}
      />

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {displayCities.length === 0 ? (
          <div style={{ color: theme.textMuted, fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
            {filterYear ? `${filterYear}年暂无记录` : '还没有去过的地方\n点击地图上的城市开始吧'}
          </div>
        ) : (
          displayCities.map(cityId => {
            const city = citiesMap[cityId]
            const record = records[cityId]
            return (
              <CityCard
                key={cityId}
                city={city || { id: cityId, name: record?.regionName || cityId, province: '' }}
                record={record || null}
                onClick={onCityClick}
              />
            )
          })
        )}
      </div>

      {!filterYear && (
        <>
          <RouteManager
            routes={routes}
            records={records}
            citiesMap={citiesMap}
            onCreateRoute={onCreateRoute}
            onDeleteRoute={onDeleteRoute}
            onPlayRoute={onPlayRoute}
          />
          <DataBackup onImportDone={onImportDone} />
        </>
      )}
    </div>
  )
}
