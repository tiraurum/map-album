import { useState, useEffect, useMemo } from 'react'
import cities from '../data/cities.json'
import {
  buildCityAreaMap,
  computeVisitedArea,
  computeTimeSpan,
  formatDays,
  formatArea,
} from '../utils/geoStats'

/**
 * Custom hook that loads city-level GeoJSON and computes travel statistics:
 *   - visitedCitiesCount / totalCitiesCount
 *   - totalArea (km², formatted)
 *   - timeSpan (days, formatted)
 *   - isLoading
 */
export function useTravelStats(records) {
  const [cityGeoData, setCityGeoData] = useState(null)
  const [geoLoading, setGeoLoading] = useState(true)

  // Load city GeoJSON
  useEffect(() => {
    fetch('/data/中国_市.geojson')
      .then(r => r.json())
      .then(data => {
        setCityGeoData(data)
        setGeoLoading(false)
      })
      .catch(() => {
        setGeoLoading(false)
      })
  }, [])

  const stats = useMemo(() => {
    if (!records) {
      return {
        visitedCitiesCount: 0,
        totalCitiesCount: cities.length,
        totalAreaFormatted: '0',
        timeSpanFormatted: '',
        timeSpanDays: 0,
      }
    }

    // Collect visited records
    const visitedRecords = Object.values(records).filter(r => r?.visited)

    // ── City count ──
    const citiesSet = new Set(cities.map(c => c.id))
    const visitedCityIds = visitedRecords
      .filter(r => citiesSet.has(r.cityId))
      .map(r => r.cityId)
    const visitedCitiesCount = visitedCityIds.length
    const totalCitiesCount = cities.length

    // ── Area ──
    let totalAreaKm2 = 0
    if (cityGeoData) {
      const areaMap = buildCityAreaMap(cityGeoData)
      const visitedCodes = new Set(visitedCityIds.map(id => String(id).padStart(6, '0')))
      totalAreaKm2 = computeVisitedArea(visitedCodes, areaMap)
    }

    // ── Time span ──
    const span = computeTimeSpan(visitedRecords)

    return {
      visitedCitiesCount,
      totalCitiesCount,
      totalAreaFormatted: formatArea(totalAreaKm2),
      totalAreaKm2,
      timeSpanFormatted: formatDays(span.days),
      timeSpanDays: span.days,
    }
  }, [records, cityGeoData])

  return {
    ...stats,
    isLoading: geoLoading,
  }
}
