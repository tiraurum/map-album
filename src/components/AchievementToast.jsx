import { useEffect, useState, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

/**
 * Steam-style achievement toast — slides in from bottom-left, auto-dismisses after 10s.
 * Multiple toasts stack upward.
 */
export default function AchievementToast({ queue, onDismiss }) {
  const { theme } = useTheme()
  const timers = useRef({})

  // Auto-dismiss each toast after 10s
  useEffect(() => {
    queue.forEach(a => {
      if (!timers.current[a.id]) {
        timers.current[a.id] = setTimeout(() => {
          onDismiss(a.id)
          delete timers.current[a.id]
        }, 10000)
      }
    })
    // Clean up timers for dismissed items
    return () => {
      Object.keys(timers.current).forEach(id => {
        if (!queue.find(a => a.id === id)) {
          clearTimeout(timers.current[id])
          delete timers.current[id]
        }
      })
    }
  }, [queue, onDismiss])

  if (!queue.length) return null

  return (
    <div style={{
      position: 'absolute',
      bottom: '8px',
      left: '8px',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column-reverse',
      gap: '8px',
      pointerEvents: 'none',
    }}>
      {queue.map((a, i) => (
        <ToastItem key={a.id} achievement={a} index={i} theme={theme} />
      ))}
    </div>
  )
}

function ToastItem({ achievement: a, theme }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Slide in
    const inTimer = setTimeout(() => setVisible(true), 50)
    // Start fade out at 8.5s (leaves 1.5s for fade animation)
    const outTimer = setTimeout(() => setLeaving(true), 8500)
    return () => {
      clearTimeout(inTimer)
      clearTimeout(outTimer)
    }
  }, [])

  return (
    <div style={{
      background: 'rgba(30, 30, 40, 0.95)',
      border: '1px solid #FCC065',
      borderRadius: '10px',
      padding: '12px 16px',
      width: '280px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(252,192,101,0.2)',
      transform: visible ? 'translateX(0)' : 'translateX(-120%)',
      opacity: leaving ? 0 : 1,
      transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 1.5s ease',
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      {/* Icon */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #FCC065, #e8a840)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        flexShrink: 0,
      }}>
        🏆
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: '#FCC065',
          fontSize: '10px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          marginBottom: '2px',
          textTransform: 'uppercase',
        }}>
          成就解锁
        </div>
        <div style={{
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: 'bold',
          lineHeight: 1.3,
          marginBottom: '2px',
        }}>
          {a.name}
        </div>
        <div style={{
          color: '#aaa',
          fontSize: '11px',
        }}>
          {a.source}
        </div>
      </div>

      {/* City badge */}
      <div style={{
        background: 'rgba(252,192,101,0.15)',
        borderRadius: '6px',
        padding: '4px 8px',
        color: '#FCC065',
        fontSize: '11px',
        fontWeight: 'bold',
        flexShrink: 0,
      }}>
        {a.icon} {a.cityName}
      </div>
    </div>
  )
}
