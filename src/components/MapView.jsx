import { MapContainer, TileLayer } from 'react-leaflet'
import CityMarkers from './CityMarkers'

const CHINA_CENTER = [35.86, 104.19]
const CHINA_ZOOM = 4

export default function MapView({ cities, records, onCityClick, children }) {
  return (
    <MapContainer
      center={CHINA_CENTER}
      zoom={CHINA_ZOOM}
      minZoom={3}
      maxZoom={10}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CityMarkers
        cities={cities}
        records={records}
        onCityClick={onCityClick}
      />
      {children}
    </MapContainer>
  )
}
