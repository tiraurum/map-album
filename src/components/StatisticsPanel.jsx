import { useTravelStats } from '../hooks/useTravelStats'

/**
 * StatisticsPanel — a thin bottom bar that displays travel stats:
 * city count, area covered, and time span.
 * Always visible, providing a sense of achievement.
 */
export default function StatisticsPanel({ records }) {
  const {
    visitedCitiesCount,
    totalCitiesCount,
    totalAreaFormatted,
    timeSpanFormatted,
    isLoading,
  } = useTravelStats(records)

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '48px',
      background: '#0f1a2f',
      borderTop: '1px solid #0f3460',
      padding: '10px 24px',
      flexShrink: 0,
      minHeight: '52px',
    }}>
      {/* ── City count ── */}
      <StatItem
        icon="🏙️"
        label="已点亮中国"
        value={isLoading ? '—' : visitedCitiesCount}
        unit="个城市"
        sub={`/ ${totalCitiesCount}`}
      />

      {/* ── Divider ── */}
      <Divider />

      {/* ── Area ── */}
      <StatItem
        icon="🗺️"
        label="点亮中国约"
        value={isLoading ? '—' : totalAreaFormatted}
        unit="平方公里"
      />

      {/* ── Divider ── */}
      <Divider />

      {/* ── Time span ── */}
      <StatItem
        icon="⏳"
        label="历时"
        value={isLoading ? '—' : timeSpanFormatted || '不足 1 天'}
        unit=""
      />
    </div>
  )
}

function StatItem({ icon, label, value, unit, sub }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: '6px',
      color: '#aaa',
      fontSize: '13px',
    }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span>{label}</span>
      <strong style={{
        color: '#e94560',
        fontSize: '18px',
        fontWeight: '700',
        letterSpacing: '0.5px',
      }}>
        {value}
      </strong>
      <span>{unit}</span>
      {sub && (
        <span style={{ color: '#555', fontSize: '11px' }}>{sub}</span>
      )}
    </div>
  )
}

function Divider() {
  return (
    <div style={{
      width: '1px',
      height: '24px',
      background: '#1a2a4a',
    }} />
  )
}
