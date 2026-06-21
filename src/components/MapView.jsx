import { useState, useCallback } from 'react'
import { MapContainer } from 'react-leaflet'
import AdminBoundaries from './AdminBoundaries'
import LayerControl from './LayerControl'

const CHINA_CENTER = [35.86, 104.19]
const CHINA_ZOOM = 4

export default function MapView({ records, onRegionClick, children }) {
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
