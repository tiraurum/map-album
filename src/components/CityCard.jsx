import { useTheme } from '../context/ThemeContext'

const STATUS_LABELS = {
  'visited': { label: '已去过', color: '#e94560' },
  'wanna-go': { label: '想去', color: '#3b82f6' },
  'planned': { label: '计划中', color: '#10b981' },
}

export default function CityCard({ city, record, onClick }) {
  const { theme } = useTheme()
  const status = record?.status || (record?.visited ? 'visited' : '')
  const cfg = STATUS_LABELS[status]
  const photoCount = record?.photos?.length || 0
  const thumbnail = record?.photos?.[0]?.dataUrl

  return (
    <div
      onClick={() => onClick(city.id)}
      style={{
        background: theme.bg,
        borderRadius: '8px',
        padding: '10px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        cursor: 'pointer',
        borderLeft: cfg?.color ? `3px solid ${cfg.color}` : `3px solid ${theme.textMuted}`,
        transition: 'background 0.2s',
        boxShadow: theme.shadow || 'none',
      }}
      onMouseEnter={e => e.currentTarget.style.background = theme.surface}
      onMouseLeave={e => e.currentTarget.style.background = theme.bg}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '4px',
        background: thumbnail ? `url(${thumbnail}) center/cover` : theme.inputBg,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.textMuted,
        fontSize: '10px',
        overflow: 'hidden',
        border: `1px solid ${theme.border}`,
      }}>
        {!thumbnail && '📷'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: theme.text, fontWeight: 'bold', fontSize: '13px' }}>
          {city.name}
        </div>
        <div style={{ color: theme.textSecondary, fontSize: '11px' }}>
          {cfg && <span style={{ color: cfg.color }}>{cfg.label}</span>}
          {cfg && status === 'visited' && record?.visitDate && <> · {record.visitDate}</>}
          {cfg && status === 'visited' && !record?.visitDate && <> · 未记录时间</>}
          {cfg && status === 'visited' && <> · {photoCount}张照片</>}
        </div>
      </div>
    </div>
  )
}
