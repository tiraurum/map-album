import { createContext, useContext, useState, useMemo, useRef, useEffect } from 'react'

/* ── Theme definitions ──────────────────────────────────── */

const THEMES = {
  default: {
    id: 'default',
    name: '默认暗色',
    mapTile: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    mapBg: '#1a1a2e',
    bg: '#1a1a2e',
    surface: '#16213e',
    surfaceAlt: '#0f1a2f',
    border: '#0f3460',
    borderLight: '#1a2a4a',
    primary: '#e94560',
    primaryLight: '#ff6b81',
    text: '#e0e0e0',
    textSecondary: '#888',
    textMuted: '#555',
    inputBg: '#1a1a2e',
    inputBorder: '#333',
    shadow: 'none',
    labelColor: '#ff6b81',
    // Map geo styles
    geoBorder: '#e94560',
    geoBorderVisited: '#ff6b81',
    geoFillVisited: '#e94560',
    geoFillParent: '#e94560',
    geoHoverFill: '#ff6b81',
    geoHoverBorder: '#ff6b81',
    // Status colors
    wannaGoBorder: '#60a5fa',
    wannaGoFill: '#3b82f6',
    plannedBorder: '#34d399',
    plannedFill: '#10b981',
  },

  bright: {
    id: 'bright',
    name: '明亮系',
    mapTile: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    mapBg: '#e8e8e8',
    bg: '#f0f2f5',
    surface: '#ffffff',
    surfaceAlt: '#f8f9fa',
    border: '#d0d5dd',
    borderLight: '#e4e7ec',
    primary: '#4f46e5',
    primaryLight: '#6366f1',
    text: '#1a1a2e',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    inputBg: '#ffffff',
    inputBorder: '#d1d5db',
    shadow: '0 1px 3px rgba(0,0,0,0.08)',
    labelColor: '#c99090',
    // Map geo styles
    geoBorder: '#4f46e5',
    geoBorderVisited: '#818cf8',
    geoFillVisited: '#4f46e5',
    geoFillParent: '#4f46e5',
    geoHoverFill: '#818cf8',
    geoHoverBorder: '#818cf8',
    // Status colors
    wannaGoBorder: '#60a5fa',
    wannaGoFill: '#3b82f6',
    plannedBorder: '#34d399',
    plannedFill: '#10b981',
  },

  warm: {
    id: 'warm',
    name: '暖色系',
    mapTile: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    mapBg: '#f5efe6',
    bg: '#faf6f0',
    surface: '#fffaf3',
    surfaceAlt: '#fdf6ec',
    border: '#e8dccc',
    borderLight: '#f0e8d8',
    primary: '#D97757',
    primaryLight: '#e8997a',
    text: '#292524',
    textSecondary: '#78716c',
    textMuted: '#a8a29e',
    inputBg: '#fffaf3',
    inputBorder: '#e8dccc',
    shadow: '0 1px 3px rgba(0,0,0,0.06)',
    labelColor: '#5c3a28',
    // Map geo styles (Crail Orange #D97757)
    geoBorder: '#D97757',
    geoBorderVisited: '#D97757',
    geoFillVisited: '#D97757',
    geoFillParent: '#D97757',
    geoHoverFill: '#e8997a',
    geoHoverBorder: '#e8997a',
    // Status colors
    wannaGoBorder: '#60a5fa',
    wannaGoFill: '#3b82f6',
    plannedBorder: '#34d399',
    plannedFill: '#10b981',
  },

  white: {
    id: 'white',
    name: '白色极简',
    mapTile: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    mapBg: '#f0f0f0',
    bg: '#ffffff',
    surface: '#ffffff',
    surfaceAlt: '#fafafa',
    border: '#e5e5e5',
    borderLight: '#f0f0f0',
    primary: '#18181b',
    primaryLight: '#52525b',
    text: '#18181b',
    textSecondary: '#71717a',
    textMuted: '#a1a1aa',
    inputBg: '#ffffff',
    inputBorder: '#d4d4d8',
    shadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    labelColor: '#555555',
    // Map geo styles (black outline, gray fill)
    geoBorder: '#18181b',
    geoBorderVisited: '#18181b',
    geoFillVisited: '#a1a1aa',
    geoFillParent: '#a1a1aa',
    geoHoverFill: '#d4d4d8',
    geoHoverBorder: '#18181b',
    // Status colors
    wannaGoBorder: '#3b82f6',
    wannaGoFill: '#3b82f6',
    plannedBorder: '#10b981',
    plannedFill: '#10b981',
  },
}

/* ── Font definitions ───────────────────────────────────── */

const FONTS = {
  default: {
    id: 'default',
    name: '系统默认',
    family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  kai: {
    id: 'kai',
    name: '楷体',
    family: "'KaiTi', 'STKaiti', '楷体', 'Noto Serif SC', serif",
  },
  cascadia: {
    id: 'cascadia',
    name: 'Cascadia Mono',
    family: "'Cascadia Mono', 'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
  },
}

/* ── Context ────────────────────────────────────────────── */

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState('default')
  const [fontId, setFontId] = useState('default')

  const value = useMemo(() => ({
    themeId,
    fontId,
    theme: THEMES[themeId],
    font: FONTS[fontId],
    setThemeId,
    setFontId,
    themes: THEMES,
    fonts: FONTS,
  }), [themeId, fontId])

  const rootRef = useRef(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const t = value.theme
    el.style.setProperty('--map-bg', t.mapBg)
    el.style.setProperty('--popup-bg', t.surface)
    el.style.setProperty('--popup-text', t.text)
    el.style.setProperty('--popup-border', t.border)
    el.style.setProperty('--popup-muted', t.textMuted)
    el.style.setProperty('--popup-shadow', t.shadow || 'none')
    el.style.setProperty('--surface', t.surface)
    el.style.setProperty('--border', t.border)
    el.style.setProperty('--primary', t.primary)
    el.style.setProperty('--text', t.text)
    el.style.setProperty('--text-secondary', t.textSecondary)
    el.style.setProperty('--text-muted', t.textMuted)
    el.style.setProperty('--shadow', t.shadow || 'none')
    el.style.setProperty('--label-color', t.labelColor)
    el.style.setProperty('--label-shadow', t.id === 'default' ? '0 0 4px rgba(0,0,0,0.8)' : 'none')
  }, [value])

  return (
    <ThemeContext.Provider value={value}>
      <div ref={rootRef} style={{ fontFamily: value.font.family }}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
