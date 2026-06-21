import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from '../context/ThemeContext'

/**
 * RoutePlayback — animates a marker along a route path using requestAnimationFrame.
 * Rendered as a child of MapContainer so useMap() works.
 */
export default function RoutePlayback({ route, citiesMap, onClose }) {
  const map = useMap()
  const { theme } = useTheme()
  const animRef = useRef(null)   // requestAnimationFrame id
  const markerRef = useRef(null)
  const passedLineRef = useRef(null)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(600)  // km/h
  const [progress, setProgress] = useState(0)

  // Build coordinates from route.cityIds (memoized — stable ref during playback)
  const coordinates = useMemo(() => {
    return route?.cityIds
      ?.map(id => citiesMap[id])
      ?.filter(Boolean)
      ?.map(c => [c.lat, c.lng]) || []
  }, [route?.cityIds, citiesMap])

  // Total path length in km (pre-calculated)
  const totalDistanceRef = useRef(0)
  const segmentLengthsRef = useRef([])

  // Setup: create marker + polylines
  useEffect(() => {
    if (!map || coordinates.length < 2) return

    // Clean previous
    if (markerRef.current) map.removeLayer(markerRef.current)
    if (passedLineRef.current) map.removeLayer(passedLineRef.current)

    const markerIcon = L.divIcon({
      className: '',
      html: '<div style="width:14px;height:14px;border-radius:50%;background:#e94560;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.4)"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })

    markerRef.current = L.marker(coordinates[0], { icon: markerIcon }).addTo(map)
    passedLineRef.current = L.polyline([], { color: theme.primary || '#e94560', weight: 3 }).addTo(map)

    // Pre-compute segment distances
    let total = 0
    const segs = []
    for (let i = 0; i < coordinates.length - 1; i++) {
      const d = map.distance(L.latLng(coordinates[i]), L.latLng(coordinates[i + 1])) / 1000 // km
      segs.push(d)
      total += d
    }
    totalDistanceRef.current = total
    segmentLengthsRef.current = segs

    // Draw full path in grey
    const fullLine = L.polyline(coordinates, { color: '#555', weight: 2, opacity: 0.5 }).addTo(map)
    map.fitBounds(fullLine.getBounds(), { padding: [30, 30] })

    animRef.current = fullLine // store for cleanup

    return () => {
      if (markerRef.current) map.removeLayer(markerRef.current)
      if (passedLineRef.current) map.removeLayer(passedLineRef.current)
      if (animRef.current && animRef.current !== fullLine) {
        // animRef might be an RAF id, not a layer
        if (typeof animRef.current !== 'number') map.removeLayer(animRef.current)
      }
      map.removeLayer(fullLine)
    }
  }, [map, coordinates.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Helper: get position at a given fraction [0,1] along the path
  const getPositionAt = useCallback((frac) => {
    if (frac <= 0) return coordinates[0]
    if (frac >= 1) return coordinates[coordinates.length - 1]

    const targetDist = frac * totalDistanceRef.current
    const segs = segmentLengthsRef.current
    let accumulated = 0

    for (let i = 0; i < segs.length; i++) {
      if (accumulated + segs[i] >= targetDist) {
        const segFrac = (targetDist - accumulated) / segs[i]
        const from = L.latLng(coordinates[i])
        const to = L.latLng(coordinates[i + 1])
        return [from.lat + (to.lat - from.lat) * segFrac,
                from.lng + (to.lng - from.lng) * segFrac]
      }
      accumulated += segs[i]
    }
    return coordinates[coordinates.length - 1]
  }, [coordinates])

  // Update marker + passed line for a given progress
  const updateProgress = useCallback((frac) => {
    if (!markerRef.current || !passedLineRef.current) return
    const p = getPositionAt(frac)
    markerRef.current.setLatLng(p)

    // Build passed line up to current position
    let passedCoords = []
    const targetDist = frac * totalDistanceRef.current
    const segs = segmentLengthsRef.current
    let accumulated = 0
    passedCoords.push(coordinates[0])

    for (let i = 0; i < segs.length; i++) {
      if (accumulated + segs[i] >= targetDist) {
        const segFrac = (targetDist - accumulated) / segs[i]
        const from = L.latLng(coordinates[i])
        const to = L.latLng(coordinates[i + 1])
        passedCoords.push([
          from.lat + (to.lat - from.lat) * segFrac,
          from.lng + (to.lng - from.lng) * segFrac,
        ])
        break
      }
      passedCoords.push(coordinates[i + 1])
      accumulated += segs[i]
    }
    passedLineRef.current.setLatLngs(passedCoords)

    // Pan map to follow marker
    map.panTo(p, { animate: true })
  }, [getPositionAt, map, coordinates])

  // Animation loop
  const startAnimation = useCallback(() => {
    const startTime = performance.now()
    const speedKmPerMs = speed / (1000 * 60 * 60) // km/h → km/ms
    const totalDist = totalDistanceRef.current

    const step = (now) => {
      const elapsed = now - startTime
      const dist = elapsed * speedKmPerMs
      const frac = Math.min(dist / totalDist, 1)
      updateProgress(frac)
      setProgress(frac)

      if (frac < 1) {
        animRef.current = requestAnimationFrame(step)
      } else {
        setPlaying(false)
      }
    }

    animRef.current = requestAnimationFrame(step)
  }, [speed, updateProgress])

  const handlePlayPause = useCallback(() => {
    if (playing) {
      // Pause
      if (animRef.current && typeof animRef.current === 'number') {
        cancelAnimationFrame(animRef.current)
      }
      setPlaying(false)
    } else {
      // Play / Replay
      if (progress >= 1) {
        updateProgress(0)
        setProgress(0)
      }
      setPlaying(true)
    }
  }, [playing, progress, updateProgress])

  // Start/stop animation when `playing` changes
  useEffect(() => {
    if (playing) {
      startAnimation()
    }
    return () => {
      if (animRef.current && typeof animRef.current === 'number') {
        cancelAnimationFrame(animRef.current)
      }
    }
  }, [playing, startAnimation])

  const handleProgressChange = useCallback((e) => {
    const v = parseFloat(e.target.value)
    updateProgress(v)
    setProgress(v)
  }, [updateProgress])

  if (coordinates.length < 2) return null

  const btnBase = {
    background: 'transparent',
    border: `1px solid ${theme.border}`,
    color: theme.textSecondary,
    cursor: 'pointer',
    fontSize: '11px',
    borderRadius: '4px',
    padding: '4px 8px',
  }
  const btnActive = { ...btnBase, background: theme.primary, color: '#fff', borderColor: theme.primary }

  return (
    <div style={{
      position: 'absolute',
      bottom: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      background: 'rgba(30,30,40,0.92)',
      border: `1px solid ${theme.border}`,
      borderRadius: '10px',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      fontSize: '12px',
    }}>
      <button onClick={handlePlayPause} style={{
        ...btnBase,
        background: theme.primary, color: '#fff', borderColor: theme.primary,
        fontSize: '14px', fontWeight: 'bold', padding: '4px 14px',
      }}>
        {playing ? '⏸' : progress >= 1 ? '↺' : '▶'}
      </button>

      <input type="range" min="0" max="1" step="0.01"
        value={progress} onChange={handleProgressChange}
        style={{ width: '120px', accentColor: theme.primary }} />
      <span style={{ color: theme.textSecondary, minWidth: '30px' }}>
        {Math.round(progress * 100)}%
      </span>

      <div style={{ display: 'flex', gap: '2px' }}>
        {[300, 600, 1200, 2400].map(s => (
          <button key={s} onClick={() => setSpeed(s)}
            style={speed === s ? btnActive : btnBase}>
            {s}
          </button>
        ))}
      </div>

      <button onClick={onClose} style={{
        ...btnBase, border: 'none', fontSize: '14px', color: theme.textMuted,
      }}>
        ✕
      </button>
    </div>
  )
}
