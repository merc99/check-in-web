'use client'

// Pattern: mmo fx kit / holo sheen and aurora frame (adapted to Check-in tokens). See loops.module.css.
import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import styles from './loops.module.css'

/** Pause decorative loops while the tab is hidden (they read --fx-play). */
function usePauseWhenHidden() {
  useEffect(() => {
    const sync = () => document.documentElement.style.setProperty('--fx-play', document.hidden ? 'paused' : 'running')
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])
}

/**
 * A holographic sheen gliding across its parent (a `relative` element with rounded corners).
 * Motion budget: invite tickets only.
 */
export function SheenLoop() {
  usePauseWhenHidden()
  return <span aria-hidden="true" className={styles.sheen} />
}

/**
 * A turning multicolor edge with a soft glow around its child. Motion budget: the crew hero, only
 * while the whole crew is in today. `on` false renders the child as-is.
 */
export function AuroraFrame({ on, className, children }: { on: boolean; className?: string; children: ReactNode }) {
  usePauseWhenHidden()
  return <div className={cn(on && styles.aurora, className)}>{children}</div>
}

/** One pass of the holo sheen over its parent, for a card that just arrived (feed posts). */
export function SheenOnce() {
  return <span aria-hidden="true" className={styles.once} />
}
