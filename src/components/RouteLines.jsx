import { Polyline } from 'react-leaflet'

export default function RouteLines({ routes, citiesMap, playingRouteId }) {
  if (!routes?.length) return null

  return (
    <>
      {routes.map(route => {
        // Hide the static line while this route is being played
        if (playingRouteId === route.id) return null

        const positions = route.cityIds
          .map(id => citiesMap[id])
          .filter(Boolean)
          .map(c => [c.lat, c.lng])

        if (positions.length < 2) return null

        return (
          <Polyline
            key={route.id}
            positions={positions}
            pathOptions={{
              color: '#e94560',
              weight: 2,
              opacity: 0.6,
            }}
          />
        )
      })}
    </>
  )
}
