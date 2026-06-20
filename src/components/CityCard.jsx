export default function CityCard({ city, record, onClick }) {
  const photoCount = record?.photos?.length || 0
  const thumbnail = record?.photos?.[0]?.dataUrl

  return (
    <div
      onClick={() => onClick(city.id)}
      style={{
        background: '#1a1a2e',
        borderRadius: '8px',
        padding: '10px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        cursor: 'pointer',
        borderLeft: '3px solid #e94560',
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#16213e'}
      onMouseLeave={e => e.currentTarget.style.background = '#1a1a2e'}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '4px',
        background: thumbnail ? `url(${thumbnail}) center/cover` : '#333',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#555',
        fontSize: '10px',
        overflow: 'hidden',
      }}>
        {!thumbnail && '📷'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>
          {city.name}
        </div>
        <div style={{ color: '#888', fontSize: '11px' }}>
          {record.visitDate || '未记录时间'} · {photoCount}张照片
        </div>
      </div>
    </div>
  )
}
