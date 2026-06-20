import CityCard from './CityCard'

export default function Sidebar({ visitedCities, citiesMap, records, onCityClick }) {
  return (
    <div style={{
      width: '240px',
      background: '#16213e',
      borderLeft: '1px solid #0f3460',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{
        padding: '14px 14px 10px',
        color: '#e94560',
        fontWeight: 'bold',
        fontSize: '14px',
        borderBottom: '1px solid #0f3460',
      }}>
        📍 我的足迹 ({visitedCities.length})
      </div>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {visitedCities.length === 0 ? (
          <div style={{ color: '#555', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
            还没有去过的地方<br />
            点击地图上的城市开始吧
          </div>
        ) : (
          visitedCities.map(cityId => {
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
    </div>
  )
}
