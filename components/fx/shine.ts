'use client'

import { useEffect, type RefObject } from 'react'
import styles from './shine.module.css'

/** The class that draws the light; pair it with `useShine` on the same element. */
export const shineClass = styles.shine

/**
 * A soft light that follows a mouse across `ref` (writes --sx / --sy and data-shine-on).
 * Mouse and pen only: touch has no hover, and the light would stick under a finger.
 */
export function useShine(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--sx', `${e.clientX - r.left}px`)
      el.style.setProperty('--sy', `${e.clientY - r.top}px`)
      el.setAttribute('data-shine-on', '')
    }
    const leave = () => el.removeAttribute('data-shine-on')
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [ref])
}
