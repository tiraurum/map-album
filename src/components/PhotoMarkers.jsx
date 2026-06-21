import { useEffect, useState } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import db from '../db'

/**
 * Reads photos from IndexedDB and renders them as circular thumbnail markers
 * on the map at each photo's GPS coordinate (or the city center if no GPS).
 */
export default function PhotoMarkers({ citiesMap, photoVersion }) {
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    db.photos.toArray().then(all => {
      setPhotos(all.filter(p => p.cityId || (p.gpsLatitude != null)))
    }).catch(() => {})
  }, [photoVersion])

  if (!photos.length) return null

  return (
    <>
      {photos.map(photo => {
        // Use GPS coords if available, else city center
        const city = citiesMap[photo.cityId]
        const lat = photo.gpsLatitude ?? city?.lat
        const lng = photo.gpsLongitude ?? city?.lng
        if (lat == null || lng == null) return null

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:36px;height:36px;border-radius:50%;overflow:hidden;
            border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);
            background:#333;
          "><img src="${photo.thumbnail || photo.dataUrl}" style="width:100%;height:100%;object-fit:cover"></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })

        return (
          <Marker key={photo.id} position={[lat, lng]} icon={icon}>
            <Popup>
              <div style={{ maxWidth: '220px', fontFamily: 'sans-serif' }}>
                <img src={photo.dataUrl} style={{ width: '100%', borderRadius: '6px', marginBottom: '6px' }} />
                <div style={{ fontSize: '12px', color: '#333' }}>
                  <div style={{ fontWeight: 'bold' }}>{photo.fileName}</div>
                  {photo.dateTimeOriginal && <div>📅 {photo.dateTimeOriginal}</div>}
                  {photo.location?.name && <div>📍 {photo.location.name}</div>}
                  {photo.gpsLatitude != null && (
                    <div style={{ color: '#999', fontSize: '11px' }}>
                      {photo.gpsLatitude.toFixed(4)}, {photo.gpsLongitude.toFixed(4)}
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}
