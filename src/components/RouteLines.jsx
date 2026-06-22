import { Polyline } from 'react-leaflet'

export default function RouteLines({ routes, citiesMap, playingRouteId, show }) {
  if (!show || !routes?.length) return null

  const displayRoutes = playingRouteId
    ? routes.filter(r => r.id === playingRouteId)
    : routes

  return (
    <>
      {displayRoutes.map(route => {
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
