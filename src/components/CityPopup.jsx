import { Popup } from 'react-leaflet'

const STATUS_CONFIG = {
  'visited': { label: '已去过', color: '#e94560' },
  'wanna-go': { label: '想去', color: '#3b82f6' },
  'planned': { label: '计划中', color: '#10b981' },
}

/** Allowed upgrades: current status → list of next statuses */
const UPGRADE_PATHS = {
  'wanna-go': [
    { status: 'planned', label: '计划中', color: '#10b981' },
    { status: 'visited', label: '已去过', color: '#e94560' },
  ],
  'planned': [
    { status: 'visited', label: '已去过', color: '#e94560' },
  ],
}

export default function CityPopup({ city, record, onMarkCity, onUpdateStatus, onUnmarkCity, onOpenDetail, onClose }) {
  const status = record?.status || (record?.visited ? 'visited' : '')
  const cfg = STATUS_CONFIG[status]

  const btnStyle = (color) => ({
    width: '100%',
    background: color,
    color: '#fff',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  })

  const outlineBtn = (color) => ({
    width: '100%',
    background: 'transparent',
    color,
    border: `1px solid ${color}`,
    padding: '6px 14px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  })

  return (
    <Popup position={[city.lat, city.lng]} onClose={onClose}>
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        minWidth: '180px',
      }}>
        <h3 style={{ margin: '0 0 4px', color: '#fff', fontSize: '16px' }}>
          {city.name}
        </h3>
        <p style={{ margin: '0 0 10px', color: '#888', fontSize: '12px' }}>
          {city.province}
        </p>

        {!status ? (
          /* ── Not marked yet — show 3 initial options ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(STATUS_CONFIG).map(([key, c]) => (
              <button key={key} onClick={() => onMarkCity(city.id, key)} style={outlineBtn(c.color)}>
                + {c.label}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Current status label */}
            <p style={{ color: cfg?.color || '#e94560', fontSize: '13px', margin: 0, fontWeight: 'bold' }}>
              ✅ {cfg?.label}
            </p>

            {/* Upgrade buttons */}
            {UPGRADE_PATHS[status]?.map(up => (
              <button key={up.status} onClick={() => onUpdateStatus(city.id, up.status)} style={outlineBtn(up.color)}>
                ↑ {up.label}
              </button>
            ))}

            {/* Detail button for visited */}
            <button onClick={() => onOpenDetail(city.id)} style={btnStyle(cfg?.color || '#e94560')}>
              查看详情
            </button>
          </div>
        )}
      </div>
    </Popup>
  )
}
