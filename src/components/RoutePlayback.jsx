import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from '../context/ThemeContext'

/**
 * RoutePlayback — 旅行动画增强版
 * 特性：动态旋转图标、脉冲光环、轨迹样式升级、距离信息显示。
 */
export default function RoutePlayback({ route, citiesMap, onClose }) {
  const map = useMap()
  const { theme } = useTheme()

  const animRef = useRef(null)
  const markerRef = useRef(null)
  const passedLineRef = useRef(null)
  const fullLineRef = useRef(null)
  const progressRef = useRef(0)
  const lastTimeRef = useRef(0)

  const [playing, setPlaying] = useState(true)
  const [duration, setDuration] = useState(10)
  const [progressUI, setProgressUI] = useState(0)
  const [currentDistKm, setCurrentDistKm] = useState(0)

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
      className: 'travel-marker-enhanced',
      html: `
        <div class="pulse-ring"></div>
        <div class="marker-rotator">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#FFD700" stroke="#FF4500" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })

    markerRef.current = L.marker(coordinates[0], { icon: markerIcon, zIndexOffset: 1000 }).addTo(map)

    passedLineRef.current = L.polyline([], {
      color: theme.primary || '#e94560',
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map)

    const fullLine = L.polyline(coordinates, {
      color: '#888',
      weight: 2,
      opacity: 0.6,
      dashArray: '5, 8',
      lineCap: 'round'
    }).addTo(map)

    fullLineRef.current = fullLine
    progressRef.current = 0

    setTimeout(() => {
      map.fitBounds(fullLine.getBounds(), { padding: [50, 50] })
    }, 50)

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
  }, [map, coordinates, theme.primary]) // eslint-disable-line react-hooks/exhaustive-deps

  const getPositionDataAt = useCallback((frac) => {
    if (frac <= 0) return { pos: coordinates[0], index: 0 }
    if (frac >= 1) return { pos: coordinates[coordinates.length - 1], index: Math.max(0, coordinates.length - 2) }

    const targetDist = frac * totalDistanceRef.current
    const segs = segmentLengthsRef.current
    let accumulated = 0

    for (let i = 0; i < segs.length; i++) {
      if (accumulated + segs[i] >= targetDist) {
        const segFrac = (targetDist - accumulated) / segs[i]
        const from = L.latLng(coordinates[i])
        const to = L.latLng(coordinates[i + 1])
        return {
          pos: [from.lat + (to.lat - from.lat) * segFrac, from.lng + (to.lng - from.lng) * segFrac],
          index: i
        }
      }
      accumulated += segs[i]
    }
    return { pos: coordinates[coordinates.length - 1], index: Math.max(0, coordinates.length - 2) }
  }, [coordinates])

  const updateProgress = useCallback((frac) => {
    if (!markerRef.current || !passedLineRef.current) return

    const { pos, index } = getPositionDataAt(frac)
    markerRef.current.setLatLng(pos)

    const safeIndex = Math.min(index, Math.max(0, coordinates.length - 2))
    const from = coordinates[safeIndex]
    const to = coordinates[Math.min(safeIndex + 1, coordinates.length - 1)] || from
    const dx = to[1] - from[1]
    const dy = to[0] - from[0]
    const angle = Math.atan2(dx, dy) * 180 / Math.PI

    const rotatorEl = markerRef.current.getElement()?.querySelector('.marker-rotator')
    if (rotatorEl) {
      rotatorEl.style.transform = `rotate(${angle}deg)`
    }

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

    map.panTo(pos, { animate: false })
  }, [getPositionDataAt, map, coordinates])

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
          setCurrentDistKm(currentFrac * totalDistanceRef.current)
          lastTimeRef._lastUIUpdate = now
        }

        if (currentFrac < 1) {
          animRef.current = requestAnimationFrame(step)
        } else {
          setProgressUI(1)
          setCurrentDistKm(totalDistanceRef.current)
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
    setCurrentDistKm(v * totalDistanceRef.current)
  }

  if (coordinates.length < 2) return null

  const btnBase = {
    background: 'transparent',
    border: `1px solid ${theme.border}`,
    color: theme.textSecondary,
    cursor: 'pointer',
    fontSize: '11px',
    borderRadius: '4px',
    padding: '4px 8px',
    transition: 'all 0.2s'
  }
  const btnActive = {
    ...btnBase,
    background: theme.primary,
    color: '#fff',
    border: `1px solid ${theme.primary}`
  }

  const speedOptions = [
    { label: '0.5x', val: 20 },
    { label: '1x', val: 10 },
    { label: '2x', val: 5 },
    { label: '4x', val: 2.5 }
  ]

  return (
    <>
      <style>{`
        .travel-marker-enhanced { position: relative; }
        .marker-rotator { transition: transform 0.1s ease-out; }
        .pulse-ring {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 20px; height: 20px;
          border-radius: 50%;
          background: ${theme.primary || '#e94560'}80;
          animation: pulse-breathe 1.5s infinite ease-out;
          z-index: -1;
        }
        @keyframes pulse-breathe {
          0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
      `}</style>

      <div style={{
        position: 'absolute',
        bottom: '12px', left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(30,30,40,0.92)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: '14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        fontSize: '12px',
      }}>
        <button onClick={handlePlayPause} style={{
          ...btnActive,
          fontSize: '14px', fontWeight: 'bold', padding: '6px 14px', borderRadius: '6px'
        }}>
          {playing ? '⏸' : progressUI >= 1 ? '↺' : '▶'}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <input type="range" min="0" max="1" step="0.01"
            value={progressUI} onChange={handleProgressChange}
            style={{ width: '200px', accentColor: theme.primary, cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textSecondary, fontSize: '10px' }}>
            <span>{currentDistKm.toFixed(1)} km</span>
            <span>{Math.round(progressUI * 100)}%</span>
            <span>{totalDistanceRef.current.toFixed(1)} km</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '6px' }}>
          {speedOptions.map(s => (
            <button key={s.label} onClick={() => setDuration(s.val)}
              style={duration === s.val ? btnActive : btnBase}>
              {s.label}
            </button>
          ))}
        </div>

        <button onClick={onClose} style={{
          ...btnBase, border: 'none', fontSize: '14px', color: theme.textMuted, padding: '4px 8px'
        }}>
          ✕
        </button>
      </div>
    </>
  )
}
