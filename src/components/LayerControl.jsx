import { useState, useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import { useTheme } from '../context/ThemeContext'

const LEVEL_INFO = [
  { key: 'province', label: '省界', zoomRange: '3–5' },
  { key: 'city',     label: '市界', zoomRange: '6–7' },
  { key: 'county',   label: '县界', zoomRange: '8' },
]

export default function LayerControl({ layers, onChange }) {
  const { theme: t } = useTheme()
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())
  const isFirst = useRef(true)

  useEffect(() => {
    const h = () => setZoom(map.getZoom())
    map.on('zoomend', h)
    return () => map.off('zoomend', h)
  }, [map])

  // Auto-suggest the zoom-appropriate layer on first mount
  useEffect(() => {
    if (!isFirst.current) return
    isFirst.current = false
    const suggested = zoom <= 5 ? 'province' : zoom <= 7 ? 'city' : 'county'
    onChange({ province: false, city: false, county: false, [suggested]: true })
  }, [zoom, onChange])

  const handleToggle = (key) => {
    onChange({ ...layers, [key]: !layers[key] })
  }

  const handleAuto = () => {
    const suggested = zoom <= 5 ? 'province' : zoom <= 7 ? 'city' : 'county'
    onChange({ province: false, city: false, county: false, [suggested]: true })
  }

  const anyChecked = layers?.province || layers?.city || layers?.county

  return (
    <div className="layer-control">
      <div className="layer-control-title">图层</div>
      {LEVEL_INFO.map(info => (
        <label key={info.key} className="layer-control-item">
          <input
            type="checkbox"
            checked={!!layers?.[info.key]}
            onChange={() => handleToggle(info.key)}
          />
          <span
            className="layer-control-swatch"
            style={{ background: t.geoBorder, opacity: layers?.[info.key] ? 1 : 0.3 }}
          />
          <span className="layer-control-label">{info.label}</span>
        </label>
      ))}
      {anyChecked && (
        <button className="layer-control-auto" onClick={handleAuto} title="恢复自动">
          ↺ 自动
        </button>
      )}
    </div>
  )
}
