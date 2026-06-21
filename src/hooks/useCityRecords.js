import { useState, useEffect, useCallback } from 'react'
import db from '../db'

export function useCityRecords() {
  const [records, setRecords] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  const loadRecords = useCallback(async () => {
    setIsLoading(true)
    try {
      const allRecords = await db.cityRecords.toArray()
      const map = {}
      allRecords.forEach(r => { map[r.cityId] = r })
      setRecords(map)
    } catch (err) {
      console.warn('IndexedDB load error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

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

  /** Add a new independent trip (photos + date + description) to a city. */
  const addTrip = useCallback(async (cityId, tripData) => {
    const now = new Date().toISOString()
    const existing = await db.cityRecords.get(cityId) || { cityId }
    const trip = {
      id: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      visitDate: tripData.visitDate || '',
      photos: tripData.photos || [],
      description: tripData.description || '',
      createdAt: now,
    }
    const trips = existing.trips || []
    const updated = {
      ...existing,
      cityId,
      visited: true,
      status: existing?.status || 'visited',
      trips: [...trips, trip],
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    }
    await db.cityRecords.put(updated)
    setRecords(prev => ({ ...prev, [cityId]: updated }))
    return updated
  }, [])

  /** Update a specific trip by trip id. */
  const updateTrip = useCallback(async (cityId, tripId, data) => {
    const existing = await db.cityRecords.get(cityId)
    if (!existing) return
    const trips = (existing.trips || []).map(t =>
      t.id === tripId ? { ...t, ...data } : t
    )
    const updated = {
      ...existing,
      trips,
      updatedAt: new Date().toISOString(),
    }
    await db.cityRecords.put(updated)
    setRecords(prev => ({ ...prev, [cityId]: updated }))
    return updated
  }, [])

  /** Remove a trip by trip id. */
  const removeTrip = useCallback(async (cityId, tripId) => {
    const existing = await db.cityRecords.get(cityId)
    if (!existing) return
    const trips = (existing.trips || []).filter(t => t.id !== tripId)
    const updated = { ...existing, trips, updatedAt: new Date().toISOString() }
    await db.cityRecords.put(updated)
    setRecords(prev => ({ ...prev, [cityId]: updated }))
    return updated
  }, [])

  /** Delete a city record entirely from IndexedDB. */
  const deleteRecord = useCallback(async (cityId) => {
    await db.cityRecords.delete(cityId)
    setRecords(prev => {
      const next = { ...prev }
      delete next[cityId]
      return next
    })
  }, [])

  return { records, getRecord, saveRecord, deleteRecord, loadRecords, addTrip, updateTrip, removeTrip, isLoading }
}
