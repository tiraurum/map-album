import { createContext, useContext, useState, useMemo, useRef, useEffect } from 'react'

/* ── Theme definitions ──────────────────────────────────── */

const THEMES = {
  default: {
    id: 'default',
    name: '默认暗色',
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
    mapBg: '#e8e8e8',
    bg: '#01847F',
    surface: '#019c96',
    surfaceAlt: '#017872',
    border: '#016b67',
    borderLight: '#017e7a',
    primary: '#F9D2E4',
    primaryLight: '#fbe0ec',
    text: '#e0f5f2',
    textSecondary: '#a8d6d2',
    textMuted: '#6bb5af',
    inputBg: '#01948E',
    inputBorder: '#016b67',
    shadow: 'none',
    labelColor: '#F9D2E4',
    geoBorder: '#F9D2E4',
    geoBorderVisited: '#F9D2E4',
    geoFillVisited: '#F9D2E4',
    geoFillParent: '#F9D2E4',
    geoHoverFill: '#fbe0ec',
    geoHoverBorder: '#fbe0ec',
    wannaGoBorder: '#60a5fa',
    wannaGoFill: '#3b82f6',
    plannedBorder: '#34d399',
    plannedFill: '#10b981',
  },

  warm: {
    id: 'warm',
    name: '暖色系',
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

  orange: {
    id: 'orange',
    name: '天蓝',
    bg: '#1E3A5F',
    surface: '#2a4d73',
    surfaceAlt: '#1a3252',
    border: '#2a4d73',
    borderLight: '#335f8a',
    primary: '#FFA43A',
    primaryLight: '#ffbe70',
    text: '#d0dce8',
    textSecondary: '#8aa8c8',
    textMuted: '#6080a0',
    inputBg: '#244568',
    inputBorder: '#2a4d73',
    shadow: 'none',
    labelColor: '#FFA43A',
    geoBorder: '#95CAFC',
    geoBorderVisited: '#95CAFC',
    geoFillVisited: '#95CAFC',
    geoFillParent: '#95CAFC',
    geoHoverFill: '#b8dbff',
    geoHoverBorder: '#b8dbff',
    wannaGoBorder: '#60a5fa',
    wannaGoFill: '#3b82f6',
    plannedBorder: '#34d399',
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
    name: '思源宋体 + Lora',
    family: "'Noto Serif SC', 'Source Han Serif SC', '思源宋体', 'Lora', Georgia, 'Times New Roman', serif",
  },
  cascadia: {
    id: 'cascadia',
    name: 'Cascadia Mono',
    family: "'Cascadia Mono', 'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei UI', sans-serif",
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
    el.style.setProperty('--popup-bg', t.surface)
    el.style.setProperty('--popup-text', t.text)
    el.style.setProperty('--popup-border', t.border)
    el.style.setProperty('--popup-muted', t.textMuted)
    el.style.setProperty('--popup-shadow', t.shadow || 'none')
    el.style.setProperty('--map-bg', t.mapBg)
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
