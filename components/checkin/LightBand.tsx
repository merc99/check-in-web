'use client'

// Pattern: 100K Club Premium UI Kit / tilting emblem's masked light band (adapted to Check-in tokens).
// Kept: a diagonal band (not a spotlight), clipped to the object. Changed: no tilt and no loop; the band
// sweeps once when a mouse comes over the object, or when `trigger` changes (the code was copied).
import { useEffect, useRef, useState } from 'react'
import styles from './LightBand.module.css'

/**
 * One sweep of light across the element it sits in. Place it as the first child of a `relative`
 * element; it clips itself to that element's rounded corners. Later positioned children (like the
 * ticket's notches) paint above it.
 */
export function LightBand({ trigger = 0 }: { trigger?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [run, setRun] = useState(0)

  // Hover with a mouse sweeps it; touch has no hover, so it relies on `trigger`.
  useEffect(() => {
    const host = ref.current?.parentElement
    if (!host) return
    const enter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') setRun((n) => n + 1)
    }
    host.addEventListener('pointerenter', enter)
    return () => host.removeEventListener('pointerenter', enter)
  }, [])

  const sweep = run + trigger
  return (
    <span ref={ref} aria-hidden="true" className={styles.clip}>
      {sweep > 0 && <span key={sweep} className={styles.band} />}
    </span>
  )
}
