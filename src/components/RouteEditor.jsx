import { useState, useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'

/**
 * RouteEditor — 可搜索所有城市，手动添加/移除到路线。
 * 不直接写 DB，通过回调与父组件同步 currentIds。
 */
export default function RouteEditor({ allCities, currentIds, onAddCity, onRemoveCity, onSave, onCancel }) {
  const { theme } = useTheme()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return allCities
    const q = search.toLowerCase()
    return allCities.filter(c =>
      c.name.toLowerCase().includes(q) || c.province.toLowerCase().includes(q)
    )
  }, [allCities, search])

  const currentSet = useMemo(() => new Set(currentIds), [currentIds])

  return (
    <div style={{
      borderTop: `1px solid ${theme.border}`,
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: theme.primary, fontSize: '12px', fontWeight: 'bold' }}>✏️ 手动编辑路线</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={onSave}
            style={{
              padding: '4px 10px', borderRadius: '4px', background: theme.primary, color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: '11px',
            }}>
            保存
          </button>
          <button onClick={onCancel}
            style={{
              padding: '4px 10px', borderRadius: '4px', background: 'transparent',
              border: `1px solid ${theme.border}`, color: theme.textSecondary,
              cursor: 'pointer', fontSize: '11px',
            }}>
            取消
          </button>
        </div>
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="搜索城市或省份..."
        style={{
          width: '100%', padding: '6px 8px', borderRadius: '6px',
          border: `1px solid ${theme.inputBorder}`, background: theme.inputBg,
          color: theme.text, fontSize: '12px', outline: 'none',
        }} />

      {/* City list */}
      <div style={{
        maxHeight: '200px', overflowY: 'auto',
        border: `1px solid ${theme.border}`, borderRadius: '6px',
      }}>
        {filtered.map(c => {
          const inRoute = currentSet.has(c.id)
          return (
            <div key={c.id} onClick={() => inRoute ? onRemoveCity(c.id) : onAddCity(c.id)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', cursor: 'pointer', fontSize: '12px',
                borderBottom: `1px solid ${theme.borderLight}`,
                background: inRoute ? `${theme.primary}18` : 'transparent',
              }}>
              <span style={{ color: theme.text }}>{c.name}</span>
              <span style={{ color: inRoute ? theme.primary : theme.textMuted, fontSize: '11px' }}>
                {inRoute ? '✓ 已添加' : '+ 添加'}
              </span>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ padding: '12px', textAlign: 'center', color: theme.textMuted, fontSize: '12px' }}>
            无匹配城市
          </div>
        )}
      </div>

      {/* Current route preview */}
      {currentIds.length > 0 && (
        <div>
          <div style={{ color: theme.textSecondary, fontSize: '11px', marginBottom: '4px' }}>
            当前路线 ({currentIds.length} 站)
          </div>
          {currentIds.map((id, i) => {
            const c = allCities.find(x => x.id === id)
            return (
              <div key={id} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '3px 6px', fontSize: '11px', color: theme.text,
              }}>
                <span style={{ color: theme.primary, width: '16px' }}>{i + 1}.</span>
                <span style={{ flex: 1 }}>{c?.name || id}</span>
                <button onClick={() => onRemoveCity(id)}
                  style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: '12px', padding: '0' }}>
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
