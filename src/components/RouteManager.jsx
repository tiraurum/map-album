import { useState, useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function RouteManager({ routes, records, citiesMap, onCreateRoute, onDeleteRoute }) {
  const { theme } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [newName, setNewName] = useState('')

  const visitedCities = useMemo(() => {
    return Object.entries(records)
      .filter(([, r]) => r?.visited && (!r.status || r.status === 'visited'))
      .map(([id]) => Number(id))
      .filter(id => citiesMap[id])
      .map(id => citiesMap[id])
  }, [records, citiesMap])

  const handleCreateAutoRoute = async () => {
    if (visitedCities.length < 2) return
    const sorted = [...visitedCities].sort((a, b) => {
      const da = records[a.id]?.visitDate || ''
      const db = records[b.id]?.visitDate || ''
      return da.localeCompare(db)
    })
    await onCreateRoute(newName || `行程 ${routes.length + 1}`, sorted.map(c => c.id))
    setNewName('')
  }

  const btnStyle = {
    width: '100%',
    background: theme.inputBg,
    color: theme.textSecondary,
    border: `1px solid ${theme.border}`,
    padding: '8px 0',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    textAlign: 'center',
    transition: 'color 0.2s',
  }

  return (
    <div style={{
      borderTop: `1px solid ${theme.border}`,
      flexShrink: 0,
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '10px',
          color: theme.textSecondary,
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>🗺️ 旅行路线 ({routes.length})</span>
        <span style={{ fontSize: '10px' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '150px', overflowY: 'auto' }}>
            {routes.length === 0 && (
              <div style={{ color: theme.textMuted, fontSize: '11px', textAlign: 'center', padding: '8px 0' }}>
                暂无路线
              </div>
            )}
            {routes.map(route => (
              <div
                key={route.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: theme.bg,
                  borderRadius: '4px',
                  padding: '6px 8px',
                }}
              >
                <span style={{ color: theme.text, fontSize: '11px' }}>
                  {route.name}
                  <span style={{ color: theme.textMuted, marginLeft: '4px' }}>
                    ({route.cityIds.length}站)
                  </span>
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteRoute(route.id) }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: theme.primary,
                    cursor: 'pointer',
                    fontSize: '11px',
                    padding: '2px 4px',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="路线名称（可选）"
              style={{
                flex: 1,
                background: theme.inputBg,
                border: `1px solid ${theme.inputBorder}`,
                borderRadius: '4px',
                padding: '6px 8px',
                color: theme.text,
                fontSize: '11px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleCreateAutoRoute}
              disabled={visitedCities.length < 2}
              style={{
                ...btnStyle,
                width: 'auto',
                padding: '6px 10px',
                fontSize: '11px',
                opacity: visitedCities.length < 2 ? 0.4 : 1,
              }}
            >
              自动生成
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
