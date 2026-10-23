'use client'

import { useSyncExternalStore } from 'react'

/** Matches Tailwind's `lg` breakpoint: the desktop layout (sidebar, rail, dialogs) starts here. */
const DESKTOP = '(min-width: 1024px)'

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * True on the desktop layout. False on the server and during hydration, so the first render
 * is always the phone layout; use it for what JS has to choose (dialog vs sheet), and Tailwind's
 * `lg:` for anything CSS can do.
 */
export function useDesktop(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP).matches, () => false)
}
