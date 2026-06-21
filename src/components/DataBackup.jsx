import { useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import db from '../db'

export default function DataBackup({ onImportDone }) {
  const { theme } = useTheme()
  const fileRef = useRef(null)

  const handleExport = async () => {
    try {
      const allRecords = await db.cityRecords.toArray()
      const blob = new Blob([JSON.stringify(allRecords, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date().toISOString().slice(0, 10)
      a.download = `map-album-backup-${date}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.warn('Export error:', err)
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!Array.isArray(data)) throw new Error('Invalid format')
      await db.cityRecords.clear()
      await db.cityRecords.bulkPut(data)
      onImportDone?.()
    } catch (err) {
      alert('导入失败：文件格式不正确')
      console.warn('Import error:', err)
    }
    if (fileRef.current) fileRef.current.value = ''
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
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      flexShrink: 0,
    }}>
      <button
        onClick={handleExport}
        style={btnStyle}
        onMouseEnter={e => e.currentTarget.style.color = theme.primary}
        onMouseLeave={e => e.currentTarget.style.color = theme.textSecondary}
      >
        📤 导出备份
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        style={btnStyle}
        onMouseEnter={e => e.currentTarget.style.color = theme.primary}
        onMouseLeave={e => e.currentTarget.style.color = theme.textSecondary}
      >
        📥 导入备份
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
    </div>
  )
}
