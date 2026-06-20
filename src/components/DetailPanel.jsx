import { useState, useEffect } from 'react'
import PhotoGrid from './PhotoGrid'
import DescriptionEditor from './DescriptionEditor'

export default function DetailPanel({ city, record, onSave, onClose }) {
  const [photos, setPhotos] = useState(record?.photos || [])
  const [description, setDescription] = useState(record?.description || '')
  const [visitDate, setVisitDate] = useState(record?.visitDate || '')

  useEffect(() => {
    setPhotos(record?.photos || [])
    setDescription(record?.description || '')
    setVisitDate(record?.visitDate || '')
  }, [record])

  const handleSave = () => {
    onSave(city.id, { photos, description, visitDate, visited: true })
  }

  return (
    <div style={{ background: '#16213e', borderTop: '1px solid #0f3460', padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '20px', margin: 0 }}>
            {city.name}
            <span style={{ color: '#e94560', fontSize: '14px', marginLeft: '10px' }}>✅ 已去过</span>
          </h2>
          <p style={{ color: '#888', fontSize: '12px', margin: '2px 0 0' }}>{city.province}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSave} style={{ background: '#e94560', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>保存</button>
          <button onClick={onClose} style={{ background: 'transparent', color: '#888', border: '1px solid #333', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>关闭</button>
        </div>
      </div>
      <div style={{ maxWidth: '600px' }}>
        <PhotoGrid photos={photos} onAddPhoto={p => setPhotos([...photos, p])} onRemovePhoto={id => setPhotos(photos.filter(p => p.id !== id))} />
        <DescriptionEditor description={description} onChange={setDescription} visitDate={visitDate} onVisitDateChange={setVisitDate} />
      </div>
    </div>
  )
}
