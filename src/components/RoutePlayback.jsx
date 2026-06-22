import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from '../context/ThemeContext'

/**
 * RoutePlayback — animates a marker along a route path.
 * 重构版：修复了动画卡顿、速度计算错误和样式警告。
 */
export default function RoutePlayback({ route, citiesMap, onClose }) {
  const map = useMap()
  const { theme } = useTheme()
  
  // Refs 用于动画循环，避免被 React 重渲染打断
  const animRef = useRef(null)
  const markerRef = useRef(null)
  const passedLineRef = useRef(null)
  const fullLineRef = useRef(null)
  const progressRef = useRef(0)
  const lastTimeRef = useRef(0)
  
  const [playing, setPlaying] = useState(true)
  const [duration, setDuration] = useState(10)
  const [progressUI, setProgressUI] = useState(0)

  const coordinates = useMemo(() => {
    return route?.cityIds
      ?.map(id => citiesMap[id])
      ?.filter(Boolean)
      ?.map(c => [c.lat, c.lng]) || []
  }, [route?.cityIds, citiesMap])

  const totalDistanceRef = useRef(0)
  const segmentLengthsRef = useRef([])

  useEffect(() => {
    if (!map || coordinates.length < 2) return

    if (markerRef.current) map.removeLayer(markerRef.current)
    if (passedLineRef.current) map.removeLayer(passedLineRef.current)
    if (fullLineRef.current) map.removeLayer(fullLineRef.current)

    const markerIcon = L.divIcon({
      className: '',
      html: '<div style="width:14px;height:14px;border-radius:50%;background:#e94560;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.4)"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })

    markerRef.current = L.marker(coordinates[0], { icon: markerIcon }).addTo(map)
    passedLineRef.current = L.polyline([], { color: theme.primary || '#e94560', weight: 3 }).addTo(map)
    
    const fullLine = L.polyline(coordinates, { color: '#555', weight: 2, opacity: 0.5 }).addTo(map)
    fullLineRef.current = fullLine
    map.fitBounds(fullLine.getBounds(), { padding: [30, 30] })

    let total = 0
    const segs = []
    for (let i = 0; i < coordinates.length - 1; i++) {
      const d = map.distance(L.latLng(coordinates[i]), L.latLng(coordinates[i + 1])) / 1000
      segs.push(d)
      total += d
    }
    totalDistanceRef.current = total
    segmentLengthsRef.current = segs

    return () => {
      if (markerRef.current) map.removeLayer(markerRef.current)
      if (passedLineRef.current) map.removeLayer(passedLineRef.current)
      if (fullLineRef.current) map.removeLayer(fullLineRef.current)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [map, coordinates, theme.primary])

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
        return [from.lat + (to.lat - from.lat) * segFrac, from.lng + (to.lng - from.lng) * segFrac]
      }
      accumulated += segs[i]
    }
    return coordinates[coordinates.length - 1]
  }, [coordinates])

  const updateProgress = useCallback((frac) => {
    if (!markerRef.current || !passedLineRef.current) return
    
    const p = getPositionAt(frac)
    markerRef.current.setLatLng(p)

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
        passedCoords.push([from.lat + (to.lat - from.lat) * segFrac, from.lng + (to.lng - from.lng) * segFrac])
        break
      }
      passedCoords.push(coordinates[i + 1])
      accumulated += segs[i]
    }
    passedLineRef.current.setLatLngs(passedCoords)
    
    map.panTo(p, { animate: false })
  }, [getPositionAt, map, coordinates])

  useEffect(() => {
    if (playing) {
      lastTimeRef.current = performance.now()
      
      const step = (now) => {
        const delta = now - lastTimeRef.current
        lastTimeRef.current = now

        const inc = delta / (duration * 1000)
        progressRef.current = Math.min(progressRef.current + inc, 1)
        
        const currentFrac = progressRef.current
        updateProgress(currentFrac)

        if (now - (lastTimeRef._lastUIUpdate || 0) > 50) {
          setProgressUI(currentFrac)
          lastTimeRef._lastUIUpdate = now
        }

        if (currentFrac < 1) {
          animRef.current = requestAnimationFrame(step)
        } else {
          setProgressUI(1)
          setPlaying(false)
        }
      }

      animRef.current = requestAnimationFrame(step)
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [playing, duration, updateProgress])

  const handlePlayPause = () => {
    if (playing) {
      setPlaying(false)
    } else {
      if (progressRef.current >= 1) {
        progressRef.current = 0
        setProgressUI(0)
      }
      setPlaying(true)
    }
  }

  const handleProgressChange = (e) => {
    const v = parseFloat(e.target.value)
    progressRef.current = v
    updateProgress(v)
    setProgressUI(v)
  }

  if (coordinates.length < 2) return null

  const btnBase = {
    background: 'transparent',
    border: '1px solid ' + theme.border,
    color: theme.textSecondary,
    cursor: 'pointer',
    fontSize: '11px',
    borderRadius: '4px',
    padding: '4px 8px',
  }
  const btnActive = { 
    ...btnBase, 
    background: theme.primary, 
    color: '#fff', 
    border: '1px solid ' + theme.primary 
  }
  const speedOptions = [
    { label: '300', val: 20 },
    { label: '600', val: 10 },
    { label: '1200', val: 5 },
    { label: '2400', val: 2.5 }
  ]

  return (
    <div style={{
      position: 'absolute',
      bottom: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      background: 'rgba(30,30,40,0.92)',
      border: '1px solid ' + theme.border,
      borderRadius: '10px',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      fontSize: '12px',
    }}>
      <button onClick={handlePlayPause} style={{
        ...btnActive,
        fontSize: '14px', 
        fontWeight: 'bold', 
        padding: '4px 14px',
      }}>
        {playing ? '\u23F8' : progressUI >= 1 ? '\u21BA' : '\u25B6'}
      </button>

      <input type="range" min="0" max="1" step="0.01"
        value={progressUI} onChange={handleProgressChange}
        style={{ width: '120px', accentColor: theme.primary }} />
      <span style={{ color: theme.textSecondary, minWidth: '30px' }}>
        {Math.round(progressUI * 100)}%
      </span>

      <div style={{ display: 'flex', gap: '2px' }}>
        {speedOptions.map(s => (
          <button key={s.label} onClick={() => setDuration(s.val)}
            style={duration === s.val ? btnActive : btnBase}>
            {s.label}
          </button>
        ))}
      </div>

      <button onClick={onClose} style={{
        ...btnBase, border: 'none', fontSize: '14px', color: theme.textMuted,
      }}>
        \u2715
      </button>
    </div>
  )
}
