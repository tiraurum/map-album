import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

function createVisitedIcon() {
  return L.divIcon({
    className: 'visited-marker',
    html: `<div style="
      width: 14px; height: 14px;
      background: #e94560;
      border-radius: 50%;
      box-shadow: 0 0 8px #e94560, 0 0 16px rgba(233,69,96,0.4);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function createUnvisitedIcon() {
  return L.divIcon({
    className: 'unvisited-marker',
    html: `<div style="
      width: 6px; height: 6px;
      background: #444;
      border-radius: 50%;
    "></div>`,
    iconSize: [6, 6],
    iconAnchor: [3, 3],
  })
}

export default function CityMarkers({ cities, records, onCityClick }) {
  return cities.map(city => {
    const record = records[city.id]
    const visited = record?.visited
    const icon = visited ? createVisitedIcon() : createUnvisitedIcon()

    return (
      <Marker
        key={city.id}
        position={[city.lat, city.lng]}
        icon={icon}
        eventHandlers={{ click: () => onCityClick(city.id) }}
      />
    )
  })
}
