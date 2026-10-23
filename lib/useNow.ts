'use client'

import { useSyncExternalStore } from 'react'

// A clock components can read during render without breaking purity: the value only
// changes when the minute ticks over, and every subscriber re-renders together.

const MINUTE = 60_000
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | undefined

function subscribe(listener: () => void) {
  listeners.add(listener)
  timer ??= setInterval(() => listeners.forEach((l) => l()), MINUTE / 4)
  return () => {
    listeners.delete(listener)
    if (!listeners.size && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

const snapshot = () => Math.floor(Date.now() / MINUTE) * MINUTE

/** Current time, rounded down to the minute. Re-renders when the minute changes. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, snapshot, () => 0)
}
