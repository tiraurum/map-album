import { useEffect, useState } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'

function loadGeoJSON(url) {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error('HTTP ' + r.status)
    return r.json()
  })
}

function bindTooltip(feature, layer) {
  if (feature.properties?.name) {
    layer.bindTooltip(feature.properties.name, {
      permanent: false,
      direction: 'center',
      className: 'region-label',
    })
  }
}

const PROVINCE_STYLE = { color: '#e94560', weight: 2, opacity: 0.5, fillOpacity: 0 }
const CITY_STYLE = { color: '#e94560', weight: 0.8, opacity: 0.3, fillOpacity: 0 }
const COUNTY_STYLE = { color: '#e94560', weight: 0.4, opacity: 0.2, fillOpacity: 0 }

export default function AdminBoundaries() {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())
  const [provinceData, setProvinceData] = useState()
  const [cityData, setCityData] = useState()
  const [countyData, setCountyData] = useState()

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom())
    map.on('zoomend', onZoom)
    return () => map.off('zoomend', onZoom)
  }, [map])

  useEffect(() => {
    loadGeoJSON('/data/中国_省.geojson').then(setProvinceData).catch(() => {})
    loadGeoJSON('/data/中国_市.geojson').then(setCityData).catch(() => {})
    loadGeoJSON('/data/中国_县.geojson').then(setCountyData).catch(() => {})
  }, [])

  return (
    <>
      {provinceData && zoom <= 5 && (
        <GeoJSON
          key="province"
          data={provinceData}
          style={PROVINCE_STYLE}
          onEachFeature={bindTooltip}
        />
      )}
      {cityData && zoom >= 6 && zoom <= 7 && (
        <GeoJSON
          key="city"
          data={cityData}
          style={CITY_STYLE}
          onEachFeature={bindTooltip}
        />
      )}
      {countyData && zoom >= 8 && (
        <GeoJSON
          key="county"
          data={countyData}
          style={COUNTY_STYLE}
          onEachFeature={bindTooltip}
        />
      )}
    </>
  )
}
