'use client'

import { useCallback, useSyncExternalStore } from 'react'

// Small on/off preferences remembered in this browser (the demo's Strava connection, perk switches).
// Same pattern as the sounds switch: read lazily, so the server never touches localStorage.

const cache = new Map<string, boolean>()
const listeners = new Set<() => void>()

function read(key: string, fallback: boolean): boolean {
  if (!cache.has(key)) {
    try {
      const v = localStorage.getItem(key)
      cache.set(key, v === null ? fallback : v === '1')
    } catch {
      cache.set(key, fallback)
    }
  }
  return cache.get(key)!
}

export function setPref(key: string, on: boolean) {
  cache.set(key, on)
  try {
    localStorage.setItem(key, on ? '1' : '0')
  } catch {
    // Not remembered; still works this visit.
  }
  listeners.forEach((l) => l())
}

/** `const [on, setOn] = usePref('checkin.strava', false)` */
export function usePref(key: string, fallback = false): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => read(key, fallback),
    () => fallback,
  )
  const set = useCallback((next: boolean) => setPref(key, next), [key])
  return [on, set]
}

export const PREF = {
  /** The demo's Strava connection (no account; sample activities). */
  strava: 'checkin.strava',
  /** Perk: the foil frame on your avatar (unlocked at Committed). */
  foilFrame: 'checkin.perk.foilFrame',
} as const
