import { MapContainer } from 'react-leaflet'
import AdminBoundaries from './AdminBoundaries'

const CHINA_CENTER = [35.86, 104.19]
const CHINA_ZOOM = 4

export default function MapView({ records, onRegionClick, children }) {
  return (
    <MapContainer
      center={CHINA_CENTER}
      zoom={CHINA_ZOOM}
      minZoom={3}
      maxZoom={8}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <AdminBoundaries records={records} onRegionClick={onRegionClick} />
      {children}
    </MapContainer>
  )
}
