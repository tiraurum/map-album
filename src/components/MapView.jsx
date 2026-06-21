import { useState, useCallback } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useTheme } from '../context/ThemeContext'
import AdminBoundaries from './AdminBoundaries'
import LayerControl from './LayerControl'

const CHINA_CENTER = [35.86, 104.19]
const CHINA_ZOOM = 4

export default function MapView({ records, onRegionClick, children }) {
  const { theme } = useTheme()
  const [visibleLayers, setVisibleLayers] = useState({
    province: true,
    city: false,
    county: false,
  })

  const handleLayerChange = useCallback((newLayers) => {
    setVisibleLayers(newLayers)
  }, [])

  return (
    <MapContainer
      center={CHINA_CENTER}
      zoom={CHINA_ZOOM}
      minZoom={3}
      maxZoom={8}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={true}
      zoomControl={false}
    >
      <TileLayer
        key={theme.id}
        url={theme.mapTile}
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
      />
      <AdminBoundaries
        records={records}
        onRegionClick={onRegionClick}
        visibleLayers={visibleLayers}
      />
      <LayerControl layers={visibleLayers} onChange={handleLayerChange} />
      {children}
    </MapContainer>
  )
}
