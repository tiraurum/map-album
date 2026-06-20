export default function DescriptionEditor({ description, onChange, visitDate, onVisitDateChange }) {
  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>到访时间</label>
        <input
          type="date" value={visitDate || ''} onChange={e => onVisitDateChange(e.target.value)}
          style={{
            width: '100%', padding: '8px 10px', background: '#1a1a2e', border: '1px solid #333',
            borderRadius: '4px', color: '#e0e0e0', fontSize: '13px', outline: 'none',
          }}
        />
      </div>
      <div>
        <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>旅行回忆</label>
        <textarea
          value={description || ''} onChange={e => onChange(e.target.value)}
          placeholder="写下在这座城市的回忆..." rows={4}
          style={{
            width: '100%', padding: '10px', background: '#1a1a2e', border: '1px solid #333',
            borderRadius: '4px', color: '#e0e0e0', fontSize: '13px', resize: 'vertical',
            outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  )
}
