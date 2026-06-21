import { useTheme } from '../context/ThemeContext'

const SORT_OPTIONS = [
  { value: 'default', label: '默认' },
  { value: 'date-asc', label: '日期 ↑' },
  { value: 'date-desc', label: '日期 ↓' },
]

export default function SidebarFilterBar({ yearOptions, filterYear, onFilterYearChange, sortOrder, onSortChange }) {
  const { theme } = useTheme()

  const baseBtn = (active) => ({
    background: active ? theme.border : 'transparent',
    color: active ? theme.primary : theme.textMuted,
    border: `1px solid ${active ? theme.primary : theme.inputBorder}`,
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'all 0.15s',
  })

  return (
    <div style={{
      padding: '8px 10px',
      borderBottom: `1px solid ${theme.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      flexShrink: 0,
      background: theme.surface,
    }}>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {yearOptions.map(year => (
          <button
            key={year}
            onClick={() => onFilterYearChange(filterYear === year ? '' : year)}
            style={baseBtn(filterYear === year)}
          >
            {year === '' ? '全部' : year}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onSortChange(opt.value)}
            style={baseBtn(sortOrder === opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
