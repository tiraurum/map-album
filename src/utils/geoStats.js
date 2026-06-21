/**
 * Compute the approximate geodesic area (in km²) of a GeoJSON polygon ring.
 * Coordinates are [lng, lat] as per the GeoJSON spec.
 * Uses a spherical approximation with Earth's mean radius.
 */
function ringArea(ring) {
  const R = 6371000 // Earth mean radius in meters
  let area = 0
  const n = ring.length
  if (n < 4) return 0 // degenerate

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const lng1 = ring[i][0] * Math.PI / 180
    const lat1 = ring[i][1] * Math.PI / 180
    const lng2 = ring[j][0] * Math.PI / 180
    const lat2 = ring[j][1] * Math.PI / 180
    area += (lng2 - lng1) * Math.sin((lat2 + lat1) / 2)
  }

  return Math.abs(area * R * R) / 1e6 // convert m² → km²
}

/**
 * Compute the total area of a GeoJSON geometry (Polygon or MultiPolygon).
 * Returns area in km².
 */
function geometryArea(geometry) {
  if (!geometry) return 0
  if (geometry.type === 'Polygon') {
    return ringArea(geometry.coordinates[0])
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.reduce(
      (sum, polygon) => sum + ringArea(polygon[0]),
      0
    )
  }
  return 0
}

/**
 * Build a lookup: city-code (last 6 chars of gb) → { name, area }
 * from city-level GeoJSON data.
 */
export function buildCityAreaMap(geojsonData) {
  if (!geojsonData?.features) return {}
  const map = {}
  for (const f of geojsonData.features) {
    const gb = f.properties?.gb
    if (!gb || typeof gb !== 'string') continue
    const code = gb.slice(-6) // last 6 digits = city/district code
    map[code] = {
      name: f.properties.name || '',
      area: geometryArea(f.geometry),
    }
  }
  return map
}

/**
 * Compute the total visited area by looking up visited city codes
 * against the area map.
 * @param {Set<string>} visitedCodes - set of city codes (e.g. "110000")
 * @param {object} cityAreaMap - map from buildCityAreaMap
 * @returns {number} total area in km²
 */
export function computeVisitedArea(visitedCodes, cityAreaMap) {
  let total = 0
  for (const code of visitedCodes) {
    const entry = cityAreaMap[code]
    if (entry) total += entry.area
  }
  return total
}

/**
 * Compute the time span (in days) between the earliest and latest
 * actual visit dates (足迹时间跨度).
 * Uses visitDate as the primary source; falls back to createdAt
 * for records where the user didn't set an explicit visit date.
 * @param {Array<object>} visitedRecords - array of Dexie records
 * @returns {{ days: number, earliest: string|null, latest: string|null }}
 */
export function computeTimeSpan(visitedRecords) {
  if (!visitedRecords || visitedRecords.length < 1) {
    return { days: 0, earliest: null, latest: null }
  }

  let earliest = Infinity
  let latest = -Infinity

  for (const r of visitedRecords) {
    // Collect all dates: main visitDate + trips' visitDate
    const dates = []
    if (r.visitDate) dates.push(r.visitDate)
    if (r.trips) {
      r.trips.forEach(t => {
        if (t.visitDate) dates.push(t.visitDate)
      })
    }
    // Fallback: createdAt
    if (dates.length === 0 && r.createdAt) dates.push(r.createdAt)

    for (const dateStr of dates) {
      const t = new Date(dateStr).getTime()
      if (!isNaN(t)) {
        if (t < earliest) earliest = t
        if (t > latest) latest = t
      }
    }
  }

  if (earliest === Infinity) return { days: 0, earliest: null, latest: null }

  const diffMs = latest - earliest
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return {
    days: Math.max(days, 0),
    earliest: new Date(earliest).toISOString(),
    latest: new Date(latest).toISOString(),
  }
}

/**
 * Format days into a human-readable string like "1286 天".
 */
export function formatDays(days) {
  if (!days) return ''
  if (days < 365) return `${days} 天`
  const years = Math.floor(days / 365)
  const remainingDays = days % 365
  if (remainingDays === 0) return `${years} 年`
  return `${years} 年 ${remainingDays} 天`
}

/**
 * Format area in km² with appropriate precision.
 */
export function formatArea(areaKm2) {
  if (!areaKm2 || areaKm2 < 1) return '不足 1'
  if (areaKm2 >= 10000) {
    return (areaKm2 / 10000).toFixed(1).replace(/\.0$/, '') + ' 万'
  }
  return Math.round(areaKm2).toLocaleString()
}
