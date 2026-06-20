import { Polyline } from 'react-leaflet'

export default function RouteLines({ visitedCities, citiesMap }) {
  if (visitedCities.length < 2) return null

  const positions = visitedCities
    .map(id => citiesMap[id])
    .filter(Boolean)
    .map(c => [c.lat, c.lng])

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: '#e94560',
        weight: 1.5,
        opacity: 0.4,
        dashArray: '4, 6',
      }}
    />
  )
}
