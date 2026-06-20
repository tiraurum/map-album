import { useState, useEffect, useCallback } from 'react'
import db from '../db'

export function useCityRecords() {
  const [records, setRecords] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    db.cityRecords.toArray().then(allRecords => {
      const map = {}
      allRecords.forEach(r => { map[r.cityId] = r })
      setRecords(map)
    }).catch(err => {
      console.warn('IndexedDB load error:', err)
    }).finally(() => {
      setIsLoading(false)
    })
  }, [])

  const getRecord = useCallback((cityId) => {
    return records[cityId] || null
  }, [records])

  const saveRecord = useCallback(async (cityId, data) => {
    const now = new Date().toISOString()
    const existing = await db.cityRecords.get(cityId)
    const record = {
      ...existing,
      cityId,
      ...data,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    }
    await db.cityRecords.put(record)
    setRecords(prev => ({ ...prev, [cityId]: record }))
    return record
  }, [])

  return { records, getRecord, saveRecord, isLoading }
}
