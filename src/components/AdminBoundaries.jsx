import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'
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

// ── Style constants ────────────────────────────────────────

const LEVEL_ORDER = ['province', 'city', 'county']

const STYLES = {
  province: { color: '#e94560', weight: 2, opacity: 0.6, fillOpacity: 0 },
  city:     { color: '#e94560', weight: 1.2, opacity: 0.45, fillOpacity: 0 },
  county:   { color: '#e94560', weight: 0.6, opacity: 0.3, fillOpacity: 0 },
}

const VISITED = {
  color: '#ff6b81', weight: 2.8, opacity: 1,
  fillColor: '#e94560', fillOpacity: 0.35,
}

const PARENT_VISITED = {
  color: '#e94560', weight: 1.8, opacity: 0.75,
  fillColor: '#e94560', fillOpacity: 0.22,
}

const HOVER = {
  weight: 4.5, opacity: 1, fillOpacity: 0.4,
  fillColor: '#ff6b81', color: '#ff6b81',
}

// ── Component ──────────────────────────────────────────────

export default function AdminBoundaries({ records, onRegionClick, visibleLayers }) {
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

  // ── Visited data ─────────────────────────────────────────
  const visited = useMemo(() => {
    if (!records) return new Set()
    return new Set(
      Object.entries(records).filter(([, r]) => r?.visited).map(([k]) => String(k))
    )
  }, [records])

  const hasChild = useCallback(code => {
    if (!code || !visited.size) return false
    if (code.endsWith('0000')) {
      const pfx = code.slice(0, 2)
      return [...visited].some(k => k !== code && k.startsWith(pfx))
    }
    if (code.endsWith('00') && !code.endsWith('0000')) {
      const pfx = code.slice(0, 4)
      return [...visited].some(k => k !== code && k.startsWith(pfx))
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

  // ── Refs ────────────────────────────────────────────────
  const refs = useRef({ visited, hasChild, onRegionClick })
  refs.current = { visited, hasChild, onRegionClick }
  const hoveredRef = useRef(null)
  const allLayers = useRef([])

  // ── Style ───────────────────────────────────────────────
  const computeStyle = useCallback((code, level) => {
    const v = refs.current.visited
    const hc = refs.current.hasChild
    if (v.has(code)) return VISITED
    if (hc(code)) return PARENT_VISITED
    return STYLES[level] || STYLES.county
  }, [])

  // ── Re-apply styles on visited data change ──────────────
  useEffect(() => {
    const hov = hoveredRef.current
    allLayers.current.forEach(l => {
      if (!l._map || l === hov) return
      l.setStyle(computeStyle(l._code, l._level))
    })
  }, [records, computeStyle])

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
      allLayers.current.push(layer)

      layer.setStyle(computeStyle(code, lv))

      // Hover tooltip
      layer.bindTooltip(name, { sticky: true, className: 'region-label' })

      layer.on({
        mouseover() {
          const h = hoveredRef.current
          if (h && h !== layer) h.setStyle(computeStyle(h._code, h._level))
          layer.setStyle(HOVER)
          layer.bringToFront()
          hoveredRef.current = layer
        },
        mouseout() {
          if (hoveredRef.current !== layer) return
          layer.setStyle(computeStyle(code, lv))
          hoveredRef.current = null
        },
        click(e) {
          const cb = refs.current.onRegionClick
          if (cb) cb({ code, name, level: lv, lat: e.latlng.lat, lng: e.latlng.lng })
        },
      })


    }
  }, [map, computeStyle])

  // ── Choose data based on active layer ───────────────────
  const dataMap = { province: pData, city: cData, county: coData }
  const styleMap = { province: STYLES.province, city: STYLES.city, county: STYLES.county }

  return (
    <>
      {LEVEL_ORDER.map(lv => {
        if (lv !== activeLayer || !dataMap[lv]) return null
        return (
          <GeoJSON
            key={lv}
            data={dataMap[lv]}
            style={styleMap[lv]}
            onEachFeature={makeOnEachFeature(lv)}
          />
        )
      })}
    </>
  )
}
