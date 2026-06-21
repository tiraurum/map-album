import { useState, useEffect } from 'react'
import PhotoGrid from './PhotoGrid'
import DescriptionEditor from './DescriptionEditor'

function TripSection({ trip, index, onUpdate, onRemove }) {
  return (
    <div style={{
      background: '#1a1a2e',
      borderRadius: '8px',
      padding: '14px',
      marginBottom: '12px',
      borderLeft: '3px solid #e94560',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '10px',
      }}>
        <span style={{ color: '#e94560', fontSize: '13px', fontWeight: 'bold' }}>
          🗺️ 第 {index + 2} 次旅行
        </span>
        <button
          onClick={() => onRemove(trip.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#e94560',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '2px 6px',
          }}
        >
          删除
        </button>
      </div>
      <PhotoGrid
        photos={trip.photos || []}
        onAddPhoto={p => onUpdate(trip.id, { photos: [...(trip.photos || []), p] })}
        onRemovePhoto={id => onUpdate(trip.id, { photos: (trip.photos || []).filter(p => p.id !== id) })}
      />
      <DescriptionEditor
        description={trip.description || ''}
        onChange={desc => onUpdate(trip.id, { description: desc })}
        visitDate={trip.visitDate || ''}
        onVisitDateChange={date => onUpdate(trip.id, { visitDate: date })}
      />
    </div>
  )
}

export default function DetailPanel({ city, record, onSave, onClose, onAddTrip, onUpdateTrip, onRemoveTrip }) {
  const status = record?.status || (record?.visited ? 'visited' : '')
  const isPlanning = status === 'wanna-go' || status === 'planned'

  const [photos, setPhotos] = useState(record?.photos || [])
  const [description, setDescription] = useState(record?.description || '')
  const [visitDate, setVisitDate] = useState(record?.visitDate || '')
  const [trips, setTrips] = useState(record?.trips || [])
  const [planNotes, setPlanNotes] = useState(record?.description || '')

  useEffect(() => {
    setPhotos(record?.photos || [])
    setDescription(record?.description || '')
    setVisitDate(record?.visitDate || '')
    setTrips(record?.trips || [])
    setPlanNotes(record?.description || '')
  }, [city.id])

  const handleSave = () => {
    if (isPlanning) {
      onSave(city.id, { description: planNotes, visited: true })
    } else {
      onSave(city.id, { photos, description, visitDate, trips, visited: true })
    }
    onClose()
  }

  const handleAddTrip = () => {
    const newTrip = {
      id: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      visitDate: '',
      photos: [],
      description: '',
      createdAt: new Date().toISOString(),
    }
    setTrips(prev => [...prev, newTrip])
  }

  const handleUpdateTrip = (tripId, data) => {
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, ...data } : t))
  }

  const handleRemoveTrip = (tripId) => {
    setTrips(prev => prev.filter(t => t.id !== tripId))
  }

  const btnStyle = {
    background: 'transparent',
    color: '#e94560',
    border: '1px solid #e94560',
    padding: '8px 14px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  }

  const statusColors = { visited: '#e94560', 'wanna-go': '#3b82f6', planned: '#10b981' }
  const statusLabels = { visited: '已去过', 'wanna-go': '想去', planned: '计划中' }
  const barColor = statusColors[status] || '#e94560'

  return (
    <div style={{
      background: '#16213e',
      borderTop: `1px solid ${barColor}`,
      maxHeight: '320px',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: '20px', margin: 0 }}>
              {city.name}
              <span style={{ color: barColor, fontSize: '14px', marginLeft: '10px' }}>
                {status === 'visited' ? '✅' : status === 'wanna-go' ? '🔵' : '🟢'} {statusLabels[status]}
              </span>
            </h2>
            <p style={{ color: '#888', fontSize: '12px', margin: '2px 0 0' }}>{city.province}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { onSave(city.id, { visited: false, photos: [], description: '', visitDate: '', trips: [] }); onClose() }}
              style={btnStyle}
            >
              取消标记
            </button>
            <button onClick={handleSave} style={{ ...btnStyle, background: barColor, color: '#fff', border: 'none' }}>保存</button>
            <button onClick={onClose} style={{ ...btnStyle, color: '#888', borderColor: '#333' }}>关闭</button>
          </div>
        </div>

        <div style={{ maxWidth: '600px' }}>
          {isPlanning ? (
            /* ── Planning layout (wanna-go / planned) ── */
            <div>
              <h3 style={{ color: barColor, fontSize: '14px', marginBottom: '10px' }}>
                📝 旅行计划
              </h3>
              <textarea
                value={planNotes}
                onChange={e => setPlanNotes(e.target.value)}
                placeholder={status === 'wanna-go' ? '为什么想去这里？有什么期待的景点或美食？' : '计划什么时候去？路线怎么安排？'}
                rows={5}
                style={{
                  width: '100%', padding: '12px', background: '#1a1a2e', border: '1px solid #333',
                  borderRadius: '6px', color: '#e0e0e0', fontSize: '13px', resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
          ) : (
            /* ── Visited layout ── */
            <>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ color: '#e94560', fontSize: '14px', marginBottom: '10px' }}>🛩️ 首次到访</h3>
                <PhotoGrid photos={photos} onAddPhoto={p => setPhotos(prev => [...prev, p])} onRemovePhoto={id => setPhotos(prev => prev.filter(p => p.id !== id))} />
                <DescriptionEditor description={description} onChange={setDescription} visitDate={visitDate} onVisitDateChange={setVisitDate} />
              </div>

              {trips.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ color: '#e94560', fontSize: '14px', marginBottom: '10px' }}>📋 更多旅行</h3>
                  {trips.map((trip, i) => (
                    <TripSection
                      key={trip.id}
                      trip={trip}
                      index={i}
                      onUpdate={handleUpdateTrip}
                      onRemove={handleRemoveTrip}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={handleAddTrip}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: '#e94560',
                  border: '2px dashed #e94560',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1a1a2e'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                + 新增一次旅行
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
