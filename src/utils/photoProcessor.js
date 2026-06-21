import EXIF from 'exif-js'
import cities from '../data/cities.json'

/* ── Image compression ─────────────────────────────────── */

/**
 * Compress an image file to a data URL under maxSizeKB.
 * Re-exported from original PhotoGrid for shared use.
 */
export function compressImage(file, maxSizeKB = 500) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > 1200) {
          height = (height * 1200) / width
          width = 1200
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        let quality = 0.8
        let dataUrl
        do {
          dataUrl = canvas.toDataURL('image/jpeg', quality)
          quality -= 0.1
        } while (dataUrl.length > maxSizeKB * 1024 && quality > 0.1)
        resolve(dataUrl)
      }
    }
  })
}

/* ─── Generate small thumbnail ────────────────────────── */

export function generateThumbnail(dataUrl, size = 80) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, size, size)
      resolve(canvas.toDataURL('image/jpeg', 0.5))
    }
    img.src = dataUrl
  })
}

/* ─── EXIF extraction ─────────────────────────────────── */

/**
 * Read a File and extract GPS + DateTime from EXIF.
 * Returns null for each field if not available.
 */
export function extractExifData(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)
    reader.onload = (e) => {
      try {
        const tags = EXIF.readFromBinaryFile(e.target.result)
        const lat = tags.GPSLatitude
        const lon = tags.GPSLongitude
        const latRef = tags.GPSLatitudeRef
        const lonRef = tags.GPSLongitudeRef

        let decimalLat = null
        let decimalLng = null
        if (lat && lon) {
          decimalLat = dmsToDecimal(lat, latRef)
          decimalLng = dmsToDecimal(lon, lonRef)
        }

        resolve({
          dateTimeOriginal: tags.DateTimeOriginal || tags.DateTime || null,
          gpsLatitude: decimalLat,
          gpsLongitude: decimalLng,
        })
      } catch {
        resolve({ dateTimeOriginal: null, gpsLatitude: null, gpsLongitude: null })
      }
    }
    reader.onerror = () => resolve({ dateTimeOriginal: null, gpsLatitude: null, gpsLongitude: null })
  })
}

/* ─── DMS → Decimal ───────────────────────────────────── */

function dmsToDecimal(dmsArray, ref) {
  if (!dmsArray || dmsArray.length < 3) return null
  const d = dmsArray[0]
  const m = dmsArray[1]
  const s = dmsArray[2]
  let decimal = d + m / 60 + s / 3600
  if (ref === 'S' || ref === 'W') decimal = -decimal
  return decimal
}

/* ─── Haversine ───────────────────────────────────────── */

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Find the nearest city in cities.json for a GPS coordinate.
 * Returns { cityId, name, province, distanceKm } or null if beyond 100km.
 */
export function findNearestCity(latitude, longitude) {
  let best = null
  let bestDist = Infinity
  for (const c of cities) {
    const d = haversineKm(latitude, longitude, c.lat, c.lng)
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }
  if (!best || bestDist > 100) return null
  return { cityId: best.id, name: best.name, province: best.province, distanceKm: Math.round(bestDist) }
}

/* ─── Full pipeline for one file ──────────────────────── */

/**
 * Process a single image file: extract EXIF, compress, generate thumbnail,
 * find nearest city. Returns a result object suitable for storing.
 */
export async function processPhotoFile(file) {
  const exif = await extractExifData(file)
  const dataUrl = await compressImage(file)
  const thumbnail = await generateThumbnail(dataUrl)

  let location = null
  if (exif.gpsLatitude != null && exif.gpsLongitude != null) {
    location = findNearestCity(exif.gpsLatitude, exif.gpsLongitude)
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    dateTimeOriginal: exif.dateTimeOriginal,
    gpsLatitude: exif.gpsLatitude,
    gpsLongitude: exif.gpsLongitude,
    dataUrl,
    thumbnail,
    location, // { cityId, name, province, distanceKm } or null
    createdAt: new Date().toISOString(),
  }
}
