import { useState, useEffect, useCallback } from 'react'
import db from '../db'

export function useRoutes() {
  const [routes, setRoutes] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    db.routes.toArray().then(all => {
      setRoutes(all.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')))
    }).catch(() => {}).finally(() => setIsLoading(false))
  }, [])

  const createRoute = useCallback(async (name, cityIds) => {
    const now = new Date().toISOString()
    const id = crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)
    const route = { id, name, cityIds, createdAt: now, updatedAt: now }
    await db.routes.put(route)
    setRoutes(prev => [route, ...prev])
    return route
  }, [])

  const updateRoute = useCallback(async (id, data) => {
    const existing = await db.routes.get(id)
    if (!existing) return
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
    await db.routes.put(updated)
    setRoutes(prev => prev.map(r => r.id === id ? updated : r))
    return updated
  }, [])

  const deleteRoute = useCallback(async (id) => {
    await db.routes.delete(id)
    setRoutes(prev => prev.filter(r => r.id !== id))
  }, [])

  return { routes, createRoute, updateRoute, deleteRoute, isLoading }
}
