import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'

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

const BASE = {
  province: { color: '#e94560', weight: 2, opacity: 0.5, fillOpacity: 0 },
  city: { color: '#e94560', weight: 0.8, opacity: 0.3, fillOpacity: 0 },
  county: { color: '#e94560', weight: 0.4, opacity: 0.2, fillOpacity: 0 },
}

const VISITED = {
  color: '#ff6b81', weight: 2.5, opacity: 1,
  fillColor: '#e94560', fillOpacity: 0.3,
}

const PARENT_VISITED = {
  color: '#e94560', weight: 1.5, opacity: 0.7,
  fillColor: '#e94560', fillOpacity: 0.2,
}

const HOVER = {
  weight: 4, opacity: 1, fillOpacity: 0.35,
  fillColor: '#ff6b81', color: '#ff6b81',
}

export default function AdminBoundaries({ records, onRegionClick }) {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())
  const [pData, setPData] = useState()
  const [cData, setCData] = useState()
  const [coData, setCoData] = useState()

  useEffect(() => {
    const h = () => setZoom(map.getZoom())
    map.on('zoomend', h)
    return () => map.off('zoomend', h)
  }, [map])

  useEffect(() => {
    fetch('/data/中国_省.geojson').then(r => r.json()).then(setPData).catch(() => {})
    fetch('/data/中国_市.geojson').then(r => r.json()).then(setCData).catch(() => {})
    fetch('/data/中国_县.geojson').then(r => r.json()).then(setCoData).catch(() => {})
  }, [])

  // ---- Which admin level to render based on current zoom ----
  const activeLevel = zoom <= 5 ? 'province' : zoom <= 7 ? 'city' : 'county'

  const visited = useMemo(() => {
    if (!records) return new Set()
    return new Set(
      Object.entries(records)
        .filter(([, r]) => r?.visited)
        .map(([k]) => String(k))
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

  // Refs for event handlers (always up-to-date)
  const refs = useRef({ visited, hasChild, onRegionClick })
  refs.current = { visited, hasChild, onRegionClick }

  const hoveredRef = useRef(null)
  const allLayers = useRef([])

  // Compute non-hover style — no zoom-visibility checks because
  // we only render the GeoJSON for the current zoom level.
  function computeStyle(code, level) {
    const v = refs.current.visited
    const hc = refs.current.hasChild
    if (v.has(code)) return VISITED
    if (hc(code)) return PARENT_VISITED
    return BASE[level] || BASE.county
  }

  // Re-apply styles when visited data changes (zoom changes remount the layer,
  // so onEachFeature handles it naturally).
  useEffect(() => {
    const hov = hoveredRef.current
    allLayers.current.forEach(l => {
      if (!l._map || l === hov) return
      l.setStyle(computeStyle(l._code, l._level))
    })
  }, [records])

  function onEachFeature(feature, layer) {
    const name = feature.properties?.name
    const code = getCode(feature.properties)
    if (!name || !code || name === '境界线') return

    const level = getLevel(code) || 'county'
    layer._code = code
    layer._level = level
    allLayers.current.push(layer)

    layer.setStyle(computeStyle(code, level))

    layer.bindTooltip(name, {
      permanent: false, direction: 'center', className: 'region-label',
    })

    layer.on({
      mouseover() {
        const h = hoveredRef.current
        if (h && h !== layer) {
          h.setStyle(computeStyle(h._code, h._level))
        }
        layer.setStyle(HOVER)
        layer.bringToFront()
        hoveredRef.current = layer
      },
      mouseout() {
        if (hoveredRef.current !== layer) return
        layer.setStyle(computeStyle(code, level))
        hoveredRef.current = null
      },
      click(e) {
        const cb = refs.current.onRegionClick
        if (cb) cb({ code, name, level, lat: e.latlng.lat, lng: e.latlng.lng })
      },
    })
  }

  useEffect(() => {
    return () => { allLayers.current = [] }
  }, [])

  return (
    <>
      {pData && activeLevel === 'province' && (
        <GeoJSON key="province" data={pData} style={BASE.province} onEachFeature={onEachFeature} />
      )}
      {cData && activeLevel === 'city' && (
        <GeoJSON key="city" data={cData} style={BASE.city} onEachFeature={onEachFeature} />
      )}
      {coData && activeLevel === 'county' && (
        <GeoJSON key="county" data={coData} style={BASE.county} onEachFeature={onEachFeature} />
      )}
    </>
  )
}
