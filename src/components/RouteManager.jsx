import { useState, useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'
import RouteEditor from './RouteEditor'

export default function RouteManager({
  routes, records, citiesMap, allCities,
  onCreateRoute, onDeleteRoute, onPlayRoute,
  editingRouteIds, onRouteAddCity, onRouteRemoveCity, onRouteSave, onRouteCancel,
}) {
  const { theme } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [newName, setNewName] = useState('')
  const [showEditor, setShowEditor] = useState(false)

  // Cities that are visited AND have a visitDate (for auto-generate)
  const datedCities = useMemo(() => {
    return Object.entries(records)
      .filter(([, r]) => r?.visited && r?.visitDate && (!r.status || r.status === 'visited'))
      .map(([id]) => Number(id))
      .filter(id => citiesMap[id])
      .map(id => citiesMap[id])
      .sort((a, b) => (records[a.id]?.visitDate || '').localeCompare(records[b.id]?.visitDate || ''))
  }, [records, citiesMap])

  // Get next route number (handles deletion: uses max+1, not length+1)
  const nextRouteNum = useMemo(() => {
    if (routes.length === 0) return 1
    let max = 0
    for (const r of routes) {
      const m = (r.name || '').match(/^行程 (\d+)$/)
      if (m) max = Math.max(max, parseInt(m[1], 10))
    }
    return max + 1
  }, [routes])

  const handleCreateAutoRoute = async () => {
    if (datedCities.length < 2) return
    await onCreateRoute(newName || `行程 ${nextRouteNum}`, datedCities.map(c => c.id))
    setNewName('')
  }

  const handleStartManual = () => {
    setShowEditor(true)
  }

  const handleSaveManual = async () => {
    if (!editingRouteIds || editingRouteIds.length < 2) return
    await onRouteSave(newName || `行程 ${nextRouteNum}`)
    setNewName('')
    setShowEditor(false)
  }

  const handleCancelManual = () => {
    onRouteCancel()
    setShowEditor(false)
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
    <div style={{ borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
      {/* ── Header ── */}
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
          {/* ── Route list ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '150px', overflowY: 'auto' }}>
            {routes.length === 0 && (
              <div style={{ color: theme.textMuted, fontSize: '11px', textAlign: 'center', padding: '8px 0' }}>
                暂无路线
              </div>
            )}
            {routes.map(route => (
              <div key={route.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: theme.bg, borderRadius: '4px', padding: '6px 8px',
                }}
              >
                <span style={{ color: theme.text, fontSize: '11px' }}>
                  {route.name}
                  <span style={{ color: theme.textMuted, marginLeft: '4px' }}>({route.cityIds.length}站)</span>
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={(e) => { e.stopPropagation(); onPlayRoute(route) }}
                    style={{ background: 'transparent', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: '12px', padding: '2px 4px' }}>
                    ▶
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteRoute(route.id) }}
                    style={{ background: 'transparent', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: '11px', padding: '2px 4px' }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Auto-generate ── */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="路线名称（可选）"
              style={{
                flex: 1, background: theme.inputBg, border: `1px solid ${theme.inputBorder}`,
                borderRadius: '4px', padding: '6px 8px', color: theme.text, fontSize: '11px', outline: 'none',
              }} />
            <button onClick={handleCreateAutoRoute} disabled={datedCities.length < 2}
              style={{ ...btnStyle, width: 'auto', padding: '6px 10px', fontSize: '11px', opacity: datedCities.length < 2 ? 0.4 : 1 }}>
              自动生成
            </button>
          </div>
          {datedCities.length < 2 && (
            <div style={{ color: theme.textMuted, fontSize: '10px' }}>
              至少需要 2 个有到访日期的城市才能自动生成
            </div>
          )}

          {/* ── Manual editor toggle ── */}
          {!showEditor ? (
            <button onClick={handleStartManual} style={btnStyle}>
              ✏️ 手动编辑
            </button>
          ) : (
            <RouteEditor
              allCities={allCities}
              currentIds={editingRouteIds || []}
              onAddCity={onRouteAddCity}
              onRemoveCity={onRouteRemoveCity}
              onSave={handleSaveManual}
              onCancel={handleCancelManual}
            />
          )}
        </div>
      )}
    </div>
  )
}
