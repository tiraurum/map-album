import { useTheme } from '../context/ThemeContext'

export default function AchievementPanel({ unlocked, locked, unlockedCount, totalCount, onClose }) {
  const { theme } = useTheme()

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 1999,
        }}
      />

      <div style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '0',
        zIndex: 2000,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '16px',
        width: '300px',
        maxHeight: '420px',
        overflowY: 'auto',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ color: theme.primary, fontWeight: 'bold', fontSize: '13px' }}>
            🏆 成就 ({unlockedCount}/{totalCount})
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.textMuted,
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '4px',
          background: theme.border,
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${(unlockedCount / totalCount) * 100}%`,
            background: '#FCC065',
            borderRadius: '2px',
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Unlocked achievements */}
        {unlocked.length > 0 && (
          <div>
            <div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '1px' }}>
              已解锁
            </div>
            {unlocked.map(a => (
              <AchievementCard key={a.id} achievement={a} unlocked={true} theme={theme} />
            ))}
          </div>
        )}

        {/* Locked achievements */}
        {locked.length > 0 && (
          <div>
            <div style={{ color: theme.textMuted, fontSize: '10px', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '1px' }}>
              未解锁
            </div>
            {locked.map(a => (
              <AchievementCard key={a.id} achievement={a} unlocked={false} theme={theme} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function AchievementCard({ achievement: a, unlocked, theme }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 10px',
      borderRadius: '8px',
      background: unlocked ? 'rgba(252,192,101,0.08)' : 'transparent',
      opacity: unlocked ? 1 : 0.4,
      marginBottom: '4px',
    }}>
      {/* Icon */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        background: unlocked
          ? 'linear-gradient(135deg, #FCC065, #e8a840)'
          : theme.border,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        flexShrink: 0,
      }}>
        {unlocked ? '🏆' : '🔒'}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: unlocked ? theme.text : theme.textMuted,
          fontSize: '12px',
          fontWeight: 'bold',
          lineHeight: 1.3,
        }}>
          {a.name}
        </div>
        <div style={{
          color: unlocked ? theme.textSecondary : theme.textMuted,
          fontSize: '10px',
        }}>
          {unlocked ? `${a.source} · ${a.cityName}` : '???'}
        </div>
      </div>
    </div>
  )
}
