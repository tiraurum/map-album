import { useState, useRef, useCallback, useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'
import { processPhotoFile } from '../utils/photoProcessor'

export default function PhotoDropBox({ cities, onPhotoProcessed, onAssignCity }) {
  const { theme, themeId } = useTheme()
  const fileRef = useRef(null)
  const dragCount = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [pendingPhotos, setPendingPhotos] = useState([]) // persists across open/close
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [searchText, setSearchText] = useState('')

  /* ── Photo upload / processing ───────────────────────── */

  const processFiles = useCallback(async (files) => {
    const imageFiles = [...files].filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) return

    setProcessing(true)
    setProgress({ current: 0, total: imageFiles.length })

    const newUnlocated = []
    for (let i = 0; i < imageFiles.length; i++) {
      setProgress({ current: i + 1, total: imageFiles.length })
      const file = imageFiles[i]
      const photo = await processPhotoFile(file)
      photo.id = crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      if (!photo.location) {
        newUnlocated.push(photo)
      }
      if (onPhotoProcessed) await onPhotoProcessed(photo)
    }

    setProcessing(false)
    if (newUnlocated.length > 0) {
      setPendingPhotos(prev => [...prev, ...newUnlocated])
      setPanelOpen(true)
    }
  }, [onPhotoProcessed])

  /* ── Batch assign ────────────────────────────────────── */

  const handleBatchAssign = useCallback(async (cityId) => {
    const city = cities.find(c => c.id === cityId)
    if (!city || selectedIds.size === 0) return

    const selectedPhotos = pendingPhotos.filter(p => selectedIds.has(p.id))
    const photoEntries = selectedPhotos.map(p => ({
      id: p.id,
      dataUrl: p.dataUrl,
      caption: p.fileName,
      createdAt: p.createdAt,
    }))

    // Single call with all photos
    if (onAssignCity) await onAssignCity(city.id, photoEntries)

    setPendingPhotos(prev => prev.filter(p => !selectedIds.has(p.id)))
    setSelectedIds(new Set())
    setSearchText('')
  }, [cities, pendingPhotos, selectedIds, onAssignCity])

  /* ── Delete selected ─────────────────────────────────── */

  const handleDeleteSelected = useCallback(async () => {
    setPendingPhotos(prev => prev.filter(p => !selectedIds.has(p.id)))
    setSelectedIds(new Set())
  }, [selectedIds])

  /* ── Selection helpers ───────────────────────────────── */

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(pendingPhotos.map(p => p.id)))
  }, [pendingPhotos])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  /* ── Drop / drag ─────────────────────────────────────── */

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    dragCount.current = 0; setDragging(false)
    const files = e.dataTransfer?.files
    if (files?.length) processFiles(files)
  }, [processFiles])

  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation() }, [])
  const handleDragEnter = useCallback((e) => { e.preventDefault(); e.stopPropagation(); dragCount.current++; setDragging(true) }, [])
  const handleDragLeave = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    dragCount.current--
    if (dragCount.current <= 0) { dragCount.current = 0; setDragging(false) }
  }, [])

  const handleClick = () => fileRef.current?.click()

  const handleFileInput = useCallback((e) => {
    const files = e.target.files
    if (files?.length) processFiles(files)
    e.target.value = ''
  }, [processFiles])

  const handleTogglePanel = () => setPanelOpen(prev => !prev)

  /* ── Derived ─────────────────────────────────────────── */

  const isDark = themeId === 'default'
  const iconColor = isDark ? '#e94560' : theme.primary
  const hasPending = pendingPhotos.length > 0

  const filteredCities = useMemo(() => {
    if (!searchText) return cities
    const q = searchText.toLowerCase()
    return cities.filter(c =>
      c.name.toLowerCase().includes(q) || c.province.toLowerCase().includes(q)
    )
  }, [cities, searchText])

  const allSelected = pendingPhotos.length > 0 && selectedIds.size === pendingPhotos.length

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Drop zone circle ── */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        style={{
          width: '52px', height: '52px', borderRadius: '50%',
          border: dragging ? `3px dashed ${theme.primary}` : `2px dashed ${theme.border}`,
          background: dragging ? `${theme.primary}22` : theme.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '22px',
          color: dragging ? theme.primary : iconColor,
          boxShadow: dragging ? `0 0 20px ${theme.primary}44` : theme.shadow || '0 2px 8px rgba(0,0,0,0.2)',
          transform: dragging ? 'scale(1.15)' : 'scale(1)',
          transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative', zIndex: 1000,
        }}
        title={dragging ? '释放照片到此处' : '点击上传照片'}
      >
        {processing ? '⏳' : '📸'}
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileInput} />

        {/* Orange badge — toggles the pending panel */}
        {hasPending && !processing && (
          <div onClick={(e) => { e.stopPropagation(); handleTogglePanel() }}
            style={{
              position: 'absolute', top: '-4px', right: '-4px',
              width: '18px', height: '18px', borderRadius: '50%',
              background: '#f59e0b', color: '#fff',
              fontSize: '10px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
            {pendingPhotos.length}
          </div>
        )}
      </div>

      {/* ── Processing progress ── */}
      {processing && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', right: '100%', marginRight: '8px',
          background: theme.surface, border: `1px solid ${theme.border}`,
          borderRadius: '8px', padding: '10px 14px', width: '180px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)', zIndex: 1000, fontSize: '12px',
        }}>
          <div style={{ color: theme.textSecondary, marginBottom: '6px' }}>
            处理照片 {progress.current}/{progress.total}
          </div>
          <div style={{ height: '4px', background: theme.border, borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${(progress.current / progress.total) * 100}%`,
              background: theme.primary, borderRadius: '2px', transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* ── Pending photos panel ── */}
      {panelOpen && !processing && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', right: '100%', marginRight: '8px',
          background: theme.surface, border: `1px solid ${theme.border}`,
          borderRadius: '12px', padding: '12px',
          width: '320px', maxHeight: '460px', overflowY: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)', zIndex: 1000, fontSize: '12px',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '8px',
          }}>
            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
              ⏳ 待分类 ({pendingPhotos.length})
            </span>
            <button onClick={() => setPanelOpen(false)}
              style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '14px', padding: '0 2px' }}>
              ✕
            </button>
          </div>

          {pendingPhotos.length === 0 ? (
            <div style={{ color: theme.textMuted, textAlign: 'center', padding: '16px 0' }}>
              暂无待分类照片
            </div>
          ) : (
            <>
              {/* Thumbnails with checkboxes */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                {pendingPhotos.map(p => {
                  const selected = selectedIds.has(p.id)
                  return (
                    <div key={p.id} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img src={p.thumbnail || p.dataUrl} alt={p.fileName}
                        onClick={() => toggleSelect(p.id)}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px',
                          cursor: 'pointer', border: `2px solid ${selected ? theme.primary : theme.border}`,
                          opacity: selected ? 1 : 0.8,
                        }} />
                      {/* Checkbox */}
                      <div onClick={() => toggleSelect(p.id)} style={{
                        position: 'absolute', top: '2px', left: '2px', width: '20px', height: '20px',
                        borderRadius: '4px', background: selected ? theme.primary : 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#fff', fontSize: '12px', fontWeight: 'bold',
                      }}>
                        {selected ? '✓' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Select all / none */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button onClick={allSelected ? deselectAll : selectAll}
                  style={{ background: 'transparent', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: '11px', padding: '0' }}>
                  {allSelected ? '取消全选' : '全选'}
                </button>
                <span style={{ color: theme.textMuted }}>已选 {selectedIds.size}</span>
              </div>

              {/* City search + assign */}
              {selectedIds.size > 0 && (
                <div style={{ marginBottom: '8px', borderTop: `1px solid ${theme.border}`, paddingTop: '8px' }}>
                  <input
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    placeholder="搜索城市或省份..."
                    style={{
                      width: '100%', padding: '6px 8px', borderRadius: '6px',
                      border: `1px solid ${theme.inputBorder}`, background: theme.inputBg,
                      color: theme.text, fontSize: '12px', outline: 'none', marginBottom: '6px',
                    }}
                  />
                  <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {filteredCities.map(c => (
                      <button key={c.id} onClick={() => handleBatchAssign(c.id)}
                        style={{
                          textAlign: 'left', padding: '5px 8px', borderRadius: '6px',
                          background: 'transparent', border: 'none', color: theme.text,
                          cursor: 'pointer', fontSize: '11px',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = theme.border}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {c.name}, {c.province}
                      </button>
                    ))}
                    {filteredCities.length === 0 && (
                      <div style={{ color: theme.textMuted, fontSize: '11px', padding: '4px 0' }}>无匹配城市</div>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {selectedIds.size > 0 && (
                <div style={{ display: 'flex', gap: '6px', borderTop: `1px solid ${theme.border}`, paddingTop: '8px' }}>
                  <span style={{ color: theme.textMuted, fontSize: '10px', flex: 1, alignSelf: 'center' }}>
                    选中 {selectedIds.size} 张
                  </span>
                  <button onClick={handleDeleteSelected}
                    style={{
                      padding: '5px 12px', borderRadius: '6px', background: 'transparent',
                      border: `1px solid #e94560`, color: '#e94560', cursor: 'pointer', fontSize: '11px',
                    }}>
                    删除选中
                  </button>
                </div>
              )}

              {/* Add more photos */}
              <div style={{ marginTop: '8px', borderTop: `1px solid ${theme.border}`, paddingTop: '8px' }}>
                <button onClick={handleClick}
                  style={{
                    width: '100%', padding: '8px 0', borderRadius: '6px',
                    background: 'transparent', border: `1px dashed ${theme.border}`,
                    color: theme.textSecondary, cursor: 'pointer', fontSize: '11px',
                  }}>
                  + 添加更多照片
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
