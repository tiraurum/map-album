import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'
import { useTheme } from '../context/ThemeContext'
// ── Helpers ────────────────────────────────────────────────

function getCode(props) {
  if (!props?.gb || typeof props.gb !== 'string' || props.gb.length < 9) return null
  return props.gb.slice(-6)
}

function getLevel(code) {
  if (!code) return null
  if (code.endsWith('0000')) return 'province'
  if (code.endsWith('00')) return 'city'
  return 'county'
}

/** Compute centroid of the main outer ring of a polygon feature. */
function computeCentroid(layer) {
  const latlngs = layer.getLatLngs()
  let ring
  if (Array.isArray(latlngs[0]) && Array.isArray(latlngs[0][0])) {
    let maxArea = 0
    for (const poly of latlngs) {
      const r = poly[0]
      let a = 0; const n = r.length
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        a += (r[i].lat * r[j].lng - r[j].lat * r[i].lng)
      }
      a = Math.abs(a / 2)
      if (a > maxArea) { maxArea = a; ring = r }
    }
  } else {
    ring = latlngs[0]
  }
  if (!ring || ring.length < 3) return null
  let cx = 0, cy = 0, area = 0; const n = ring.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const xi = ring[i].lat, yi = ring[i].lng
    const xj = ring[j].lat, yj = ring[j].lng
    const a = xi * yj - xj * yi
    cx += (xi + xj) * a
    cy += (yi + yj) * a
    area += a
  }
  area /= 2
  if (area === 0) return null
  return [cx / (6 * area), cy / (6 * area)]
}

/** Determine which layer to show based on zoom and enabled set.
 *  Falls back to the highest enabled layer for smooth transitions. */
function resolveLayer(zoom, enabled) {
  // Natural zoom ranges
  if (zoom <= 5) {
    if (enabled.province) return 'province'
    if (enabled.city) return 'city'       // fallback up
    if (enabled.county) return 'county'   // fallback up
    return null
  }
  if (zoom <= 7) {
    if (enabled.city) return 'city'
    if (enabled.province) return 'province' // fallback down (smoother)
    if (enabled.county) return 'county'     // fallback up
    return null
  }
  // zoom >= 8
  if (enabled.county) return 'county'
  if (enabled.city) return 'city'         // fallback down
  if (enabled.province) return 'province' // fallback down
  return null
}

// ── Style constants (re-computed per render from theme) ───

const LEVEL_ORDER = ['province', 'city', 'county']

function makeStyles(t) {
  return {
    province: { color: t.geoBorder, weight: 2, opacity: 0.6, fillOpacity: 0 },
    city:     { color: t.geoBorder, weight: 1.2, opacity: 0.45, fillOpacity: 0 },
    county:   { color: t.geoBorder, weight: 0.6, opacity: 0.3, fillOpacity: 0 },
    visited:  { color: t.geoBorderVisited, weight: 2.8, opacity: 1, fillColor: t.geoFillVisited, fillOpacity: 0.35 },
    wannaGo:  { color: t.wannaGoBorder, weight: 2.8, opacity: 1, fillColor: t.wannaGoFill, fillOpacity: 0.35 },
    planned:  { color: t.plannedBorder, weight: 2.8, opacity: 1, fillColor: t.plannedFill, fillOpacity: 0.35 },
    hover:    { weight: 4.5, opacity: 1, fillOpacity: 0.4, fillColor: t.geoHoverFill, color: t.geoHoverBorder },
  }
}

/** Get parent administrative code for hierarchical heat propagation. */
function getParentCode(code) {
  if (!code || code.length < 6) return null
  if (code.endsWith('0000')) return null // province has no parent
  if (code.endsWith('00')) return code.slice(0, 2) + '0000' // city → province
  return code.slice(0, 4) + '00' // county → city
}

/** Convert hex color to RGB components string, e.g. '#e94560' → '233,69,96'. */
function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16)
  return `${(v >> 16) & 255},${(v >> 8) & 255},${v & 255}`
}

// ── Component ──────────────────────────────────────────────

export default function AdminBoundaries({ records, onRegionClick, visibleLayers }) {
  const { theme: t } = useTheme()
  const map = useMap()

  // ── GeoJSON data ─────────────────────────────────────────
  const [pData, setPData] = useState()
  const [cData, setCData] = useState()
  const [coData, setCoData] = useState()

  useEffect(() => {
    fetch('/data/中国_省.geojson').then(r => r.json()).then(setPData).catch(() => {})
    fetch('/data/中国_市.geojson').then(r => r.json()).then(setCData).catch(() => {})
    fetch('/data/中国_县.geojson').then(r => r.json()).then(setCoData).catch(() => {})
  }, [])

  // ── Zoom tracking ────────────────────────────────────────
  const [zoom, setZoom] = useState(map.getZoom())
  useEffect(() => {
    const h = () => setZoom(map.getZoom())
    map.on('zoomend', h)
    return () => map.off('zoomend', h)
  }, [map])

  // ── Active layer ─────────────────────────────────────────
  const activeLayer = useMemo(
    () => resolveLayer(zoom, visibleLayers || {}),
    [zoom, visibleLayers]
  )

  // ── Visited data (code → status) — status is single source of truth
  const visited = useMemo(() => {
    if (!records) return new Map()
    const map = new Map()
    Object.entries(records).forEach(([k, r]) => {
      if (r?.status) map.set(String(k), r.status)
    })
    return map
  }, [records])

  const hasChild = useCallback(code => {
    if (!code || !visited.size) return false
    const keys = [...visited.keys()]
    if (code.endsWith('0000')) {
      const pfx = code.slice(0, 2)
      return keys.some(k => k !== code && k.startsWith(pfx))
    }
    if (code.endsWith('00') && !code.endsWith('0000')) {
      const pfx = code.slice(0, 4)
      return keys.some(k => k !== code && k.startsWith(pfx))
    }
    return false
  }, [visited])

  // ── Tooltip close on drag ────────────────────────────────
  useEffect(() => {
    const close = () => {
      document.querySelectorAll('.leaflet-tooltip').forEach(el => el.remove())
    }
    map.on('movestart', close)
    return () => map.off('movestart', close)
  }, [map])

  // ── Ensure scroll wheel zoom is enabled ────────────────
  useEffect(() => {
    if (map.scrollWheelZoom) {
      map.scrollWheelZoom.enable()
    }
  }, [map])

  // Theme-aware style constants (rebuilt on theme change)
  const styles = useMemo(() => makeStyles(t), [t])

  // ── Heatmap intensity (with hierarchical propagation) ──
  const { maxPhoto, maxVisit, photoCountMap, intensityMap } = useMemo(() => {
    let maxPhoto = 0
    let maxVisit = 0
    const photoCountMap = {}
    const directMap = {}
    if (records) {
      Object.entries(records).forEach(([code, r]) => {
        if (!r?.visited) return
        const pc = r.photos?.length || 0
        const vc = 1
        photoCountMap[code] = pc
        if (pc > maxPhoto) maxPhoto = pc
        if (vc > maxVisit) maxVisit = vc
      })
      // Compute direct intensities
      Object.entries(records).forEach(([code, r]) => {
        if (!r?.visited) return
        const pc = photoCountMap[code] || 0
        const photoNorm = maxPhoto > 0
          ? Math.log(pc + 1) / Math.log(maxPhoto + 1)
          : 0
        const visitNorm = maxVisit > 0
          ? Math.log(1 + 1) / Math.log(maxVisit + 1)
          : 1
        directMap[code] = photoNorm * 0.6 + visitNorm * 0.4
      })
    }

    // Propagate: child → parent (MAX aggregation, two hops: county→city→province)
    const intensityMap = { ...directMap }
    // Hop 1: any level → parent
    Object.entries(directMap).forEach(([code, intensity]) => {
      const parent = getParentCode(code)
      if (parent) {
        intensityMap[parent] = Math.max(intensityMap[parent] || 0, intensity * 0.7)
      }
    })
    // Hop 2: parent → grandparent (using values from hop 1)
    Object.keys(intensityMap).forEach(code => {
      if (code in directMap) return // skip directly-visited (already handled above)
      const parent = getParentCode(code)
      if (parent) {
        intensityMap[parent] = Math.max(intensityMap[parent] || 0, (intensityMap[code] || 0) * 0.7)
      }
    })

    return { maxPhoto, maxVisit, photoCountMap, intensityMap }
  }, [records])

  // ── Tooltip builder ─────────────────────────────────────
  const buildTooltip = useCallback((code, name) => {
    const status = refs.current.visited.get(code)
    const heatIntensity = intensityMap?.[code]
    if (status === 'visited') {
      const pc = photoCountMap[code] || 0
      const pct = Math.round((heatIntensity || 0) * 100)
      return `${name}
📷 ${pc}张照片 · 热度 ${pct}%`
    }
    if (status === 'wanna-go' || status === 'planned') {
      const labels = { 'wanna-go': '想去', planned: '计划中' }
      return `${name} (${labels[status]})`
    }
    if (heatIntensity !== undefined && heatIntensity > 0.05) {
      return `${name} 🔥 ${Math.round(heatIntensity * 100)}%`
    }
    return name
  }, [intensityMap, photoCountMap])

  // ── Style ───────────────────────────────────────────────
  const computeStyle = useCallback((code, level) => {
    const v = refs.current.visited
    const hc = refs.current.hasChild
    const im = intensityMap
    if (v.has(code)) {
      const status = v.get(code)
      if (status === 'wanna-go') return styles.wannaGo
      if (status === 'planned') return styles.planned
      // Heatmap: dynamic fill opacity based on intensity
      const intensity = im[code] ?? 0.3
      const alpha = 0.15 + intensity * 0.75
      return {
        color: t.geoBorderVisited,
        weight: 2.8,
        opacity: 1,
        fillColor: `rgba(${hexToRgb(t.geoFillVisited)}, ${Math.min(alpha, 0.9).toFixed(2)})`,
        fillOpacity: 1,
      }
    }
    // Propagated heat: parent region with child heat, not directly visited
    if (hc(code) || (im[code] !== undefined && im[code] > 0.05)) {
      const intensity = im[code] ?? 0.15
      const alpha = 0.08 + intensity * 0.4
      return {
        color: t.geoFillParent,
        weight: 1.8,
        opacity: 0.75,
        fillColor: `rgba(${hexToRgb(t.geoFillParent)}, ${Math.min(alpha, 0.5).toFixed(2)})`,
        fillOpacity: 1,
      }
    }
    return styles[level] || styles.county
  }, [intensityMap, t, styles])

  // ── Refs ────────────────────────────────────────────────
  const refs = useRef({ visited, hasChild, onRegionClick })
  refs.current = { visited, hasChild, onRegionClick, computeStyle, hoverStyle: styles.hover }
  const hoveredRef = useRef(null)
  const allLayers = useRef([])

  // ── Re-apply styles & tooltips on visited data change ──
  useEffect(() => {
    const hov = hoveredRef.current
    allLayers.current.forEach(l => {
      if (!l._map || l === hov) return
      l.setStyle(refs.current.computeStyle(l._code, l._level))
      // Refresh tooltip content so unmark/cancel is reflected immediately
      if (l.getTooltip() && l._name) {
        l.setTooltipContent(buildTooltip(l._code, l._name))
      }
    })
  }, [records, t, buildTooltip])

  // ── Clean up on unmount ────────────────────────────
  useEffect(() => {
    return () => { allLayers.current = [] }
  }, [])

  // ── Build onEachFeature for one level ──────────────────
  const makeOnEachFeature = useCallback((level) => {
    return function onEachFeature(feature, layer) {
      const name = feature.properties?.name
      const code = getCode(feature.properties)
      if (!name || !code || name === '境界线') return

      const lv = getLevel(code) || 'county'
      layer._code = code
      layer._level = lv
      layer._name = name
      allLayers.current.push(layer)

      layer.setStyle(computeStyle(code, lv))

      // Enriched tooltip for visited & parent regions
      const status = refs.current.visited.get(code)
      const heatIntensity = intensityMap?.[code]
      let tooltip = name
      if (status) {
        const pc = heatIntensity !== undefined ? (photoCountMap[code] || 0) : null
        if (status === 'visited') {
          const pct = Math.round((heatIntensity || 0) * 100)
          tooltip = `${name}\n📷 ${pc}张照片 · 热度 ${pct}%`
        } else {
          const labels = { 'wanna-go': '想去', planned: '计划中' }
          tooltip = `${name} (${labels[status] || status})`
        }
      } else if (heatIntensity !== undefined && heatIntensity > 0.05) {
        const pct = Math.round(heatIntensity * 100)
        tooltip = `${name} 🔥 ${pct}%`
      }
      layer.bindTooltip(tooltip, { sticky: true, className: 'region-label' })

      layer.on({
        mouseover() {
          const h = hoveredRef.current
          if (h && h !== layer) h.setStyle(refs.current.computeStyle(h._code, h._level))
          layer.setStyle(refs.current.hoverStyle)
          layer.bringToFront()
          hoveredRef.current = layer
        },
        mouseout() {
          if (hoveredRef.current !== layer) return
          layer.setStyle(refs.current.computeStyle(code, lv))
          hoveredRef.current = null
        },
        click(e) {
          const cb = refs.current.onRegionClick
          if (cb) cb({ code, name, level: lv, lat: e.latlng.lat, lng: e.latlng.lng })
        },
      })


    }
  }, [map, computeStyle, buildTooltip])

  // ── Choose data based on active layer ───────────────────
  const dataMap = { province: pData, city: cData, county: coData }

  return (
    <>
      {LEVEL_ORDER.map(lv => {
        if (lv !== activeLayer || !dataMap[lv]) return null
        return (
          <GeoJSON
            key={lv}
            data={dataMap[lv]}
            style={styles[lv]}
            onEachFeature={makeOnEachFeature(lv)}
          />
        )
      })}
    </>
  )
}
