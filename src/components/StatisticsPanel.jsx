import { useTheme } from '../context/ThemeContext'
import { useTravelStats } from '../hooks/useTravelStats'

export default function StatisticsPanel({ records }) {
  const { theme } = useTheme()
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
      background: theme.surfaceAlt,
      borderTop: `1px solid ${theme.border}`,
      padding: '10px 24px',
      flexShrink: 0,
      minHeight: '52px',
    }}>
      <StatItem
        icon="🏙️"
        label="已点亮中国"
        value={isLoading ? '—' : visitedCitiesCount}
        unit="个城市"
        sub={`/ ${totalCitiesCount}`}
        theme={theme}
      />
      <Divider theme={theme} />
      <StatItem
        icon="🗺️"
        label="点亮中国约"
        value={isLoading ? '—' : totalAreaFormatted}
        unit="平方公里"
        theme={theme}
      />
      <Divider theme={theme} />
      <StatItem
        icon="⏳"
        label="历时"
        value={isLoading ? '—' : timeSpanFormatted || '不足 1 天'}
        unit=""
        theme={theme}
      />
    </div>
  )
}

function StatItem({ icon, label, value, unit, sub, theme }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: '6px',
      color: theme.textSecondary,
      fontSize: '13px',
    }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span>{label}</span>
      <strong style={{
        color: theme.primary,
        fontSize: '18px',
        fontWeight: '700',
        letterSpacing: '0.5px',
      }}>
        {value}
      </strong>
      <span>{unit}</span>
      {sub && (
        <span style={{ color: theme.textMuted, fontSize: '11px' }}>{sub}</span>
      )}
    </div>
  )
}

function Divider({ theme }) {
  return (
    <div style={{
      width: '1px',
      height: '24px',
      background: theme.border,
    }} />
  )
}
