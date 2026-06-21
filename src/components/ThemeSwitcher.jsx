import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeSwitcher() {
  const { theme, themeId, fontId, setThemeId, setFontId, themes, fonts } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          color: theme.textSecondary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          boxShadow: theme.shadow || 'none',
          transition: 'all 0.2s',
        }}
        title="主题与字体"
      >
        🎨
      </button>

      {/* ── Popup panel ── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 999,
            }}
          />

          <div style={{
            position: 'absolute',
            bottom: '44px',
            left: '0',
            zIndex: 1000,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            padding: '16px',
            width: '220px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            {/* ── Color themes ── */}
            <div>
              <div style={{ color: theme.textSecondary, fontSize: '11px', marginBottom: '8px', fontWeight: 'bold' }}>
                配色主题
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Object.values(themes).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setThemeId(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: themeId === t.id ? theme.border : 'transparent',
                      border: themeId === t.id ? `1px solid ${theme.primary}` : '1px solid transparent',
                      color: themeId === t.id ? theme.primary : theme.text,
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{
                      width: '14px', height: '14px',
                      borderRadius: '50%',
                      background: t.geoBorder || t.primary,
                      border: '2px solid ' + (t.geoBorderVisited || t.primary),
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
                      flexShrink: 0,
                    }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Divider ── */}
            <div style={{ height: '1px', background: theme.border }} />

            {/* ── Fonts ── */}
            <div>
              <div style={{ color: theme.textSecondary, fontSize: '11px', marginBottom: '8px', fontWeight: 'bold' }}>
                字体
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Object.values(fonts).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFontId(f.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: fontId === f.id ? theme.border : 'transparent',
                      border: fontId === f.id ? `1px solid ${theme.primary}` : '1px solid transparent',
                      color: fontId === f.id ? theme.primary : theme.text,
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: f.family,
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
