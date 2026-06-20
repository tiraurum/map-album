import { Popup } from 'react-leaflet'

export default function CityPopup({ city, record, onMarkVisited, onOpenDetail, onClose }) {
  const visited = record?.visited

  return (
    <Popup position={[city.lat, city.lng]} onClose={onClose}>
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        minWidth: '160px',
      }}>
        <h3 style={{ margin: '0 0 4px', color: '#fff', fontSize: '16px' }}>
          {city.name}
        </h3>
        <p style={{ margin: '0 0 8px', color: '#888', fontSize: '12px' }}>
          {city.province}
        </p>
        {visited ? (
          <div>
            <p style={{ color: '#e94560', fontSize: '13px', margin: '0 0 8px' }}>
              ✅ 已去过
            </p>
            <button
              onClick={() => onOpenDetail(city.id)}
              style={{
                background: '#e94560',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              查看详情
            </button>
          </div>
        ) : (
          <button
            onClick={() => onMarkVisited(city.id)}
            style={{
              background: '#0f3460',
              color: '#e94560',
              border: '1px solid #e94560',
              padding: '6px 14px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            + 标记为去过
          </button>
        )}
      </div>
    </Popup>
  )
}
