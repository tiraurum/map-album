import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import achievements from '../data/achievements'

const STORAGE_KEY = 'map-album-achievements'

function loadUnlockedSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveUnlockedSet(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export function useAchievements(records) {
  const [unlocked, setUnlocked] = useState(loadUnlockedSet)
  const [toastQueue, setToastQueue] = useState([])
  const prevUnlocked = useRef(unlocked)

  // Compute which achievements are unlocked based on records
  const allAchievements = achievements

  const currentlyUnlocked = useMemo(() => {
    if (!records) return new Set()
    const s = new Set()
    allAchievements.forEach(a => {
      const r = records[a.cityId]
      if (r?.status === 'visited') {
        s.add(a.id)
      }
    })
    return s
  }, [records, allAchievements])

  // Sync unlocked state + detect new unlocks
  useEffect(() => {
    setUnlocked(new Set([...currentlyUnlocked]))
    saveUnlockedSet(currentlyUnlocked)
  }, [currentlyUnlocked])

  // Detect newly unlocked achievements and add to toast queue
  useEffect(() => {
    const prev = prevUnlocked.current
    const newOnes = allAchievements.filter(a => unlocked.has(a.id) && !prev.has(a.id))
    if (newOnes.length > 0) {
      setToastQueue(prevQueue => [...prevQueue, ...newOnes])
    }
    prevUnlocked.current = unlocked
  }, [unlocked, allAchievements])

  const dismissToast = useCallback((achievementId) => {
    setToastQueue(prev => prev.filter(a => a.id !== achievementId))
  }, [])

  // For achievement panel: separate locked/unlocked
  const locked = useMemo(() => {
    return allAchievements.filter(a => !unlocked.has(a.id))
  }, [allAchievements, unlocked])

  const unlockedList = useMemo(() => {
    return allAchievements.filter(a => unlocked.has(a.id))
  }, [allAchievements, unlocked])

  return {
    allAchievements,
    unlocked: unlockedList,
    locked,
    toastQueue,
    dismissToast,
    unlockedCount: unlocked.size,
    totalCount: allAchievements.length,
  }
}
