import { useRef } from 'react'

function compressImage(file, maxSizeKB = 500) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > 1200) {
          height = (height * 1200) / width
          width = 1200
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        let quality = 0.8
        let dataUrl
        do {
          dataUrl = canvas.toDataURL('image/jpeg', quality)
          quality -= 0.1
        } while (dataUrl.length > maxSizeKB * 1024 && quality > 0.1)
        resolve(dataUrl)
      }
    }
  })
}

export default function PhotoGrid({ photos = [], onAddPhoto, onRemovePhoto }) {
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await compressImage(file)
    onAddPhoto({
      id: Date.now().toString(),
      dataUrl,
      caption: '',
      createdAt: new Date().toISOString(),
    })
    e.target.value = ''
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {photos.map(photo => (
          <div key={photo.id} style={{ position: 'relative', width: '80px', height: '80px' }}>
            <img
              src={photo.dataUrl}
              alt={photo.caption || '照片'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }}
            />
            <button
              onClick={() => onRemovePhoto(photo.id)}
              style={{
                position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px',
                borderRadius: '50%', background: '#e94560', color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: '12px', lineHeight: '20px', textAlign: 'center',
              }}
            >×</button>
          </div>
        ))}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '80px', height: '80px', background: '#1a1a2e', border: '2px dashed #333',
            borderRadius: '6px', color: '#666', fontSize: '24px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >+</button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
      </div>
      {photos.length > 0 && (
        <p style={{ color: '#666', fontSize: '11px' }}>共 {photos.length} 张照片</p>
      )}
    </div>
  )
}
