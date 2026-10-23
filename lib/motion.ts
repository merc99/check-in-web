'use client'

import { useEffect, useRef, useState } from 'react'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Shows `value`, rolling up from the previous value (or `from` on first render) over
 * `duration` ms with an ease-out. Jumps straight there when motion is reduced.
 */
export function useCountUp(value: number, { from, duration = 500, delay = 0 }: { from?: number; duration?: number; delay?: number } = {}) {
  const [shown, setShown] = useState(from ?? value)
  const previous = useRef(from ?? value)

  useEffect(() => {
    const start = previous.current
    previous.current = value
    if (start === value || prefersReducedMotion()) {
      setShown(value)
      return
    }
    let raf = 0
    const timer = setTimeout(() => {
      const t0 = performance.now()
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / duration)
        setShown(Math.round(start + (value - start) * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [value, duration, delay])

  return shown
}

/** True once the window has scrolled past `threshold` px. */
export function useScrolledPast(threshold: number): boolean {
  const [past, setPast] = useState(false)
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return past
}
