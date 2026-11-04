'use client'

import { useEffect, type RefObject } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * Let a mouse drag a horizontal scroller (touch already swipes natively). Snapping is paused while
 * dragging so the row follows the hand; on release it keeps the throw's speed for a moment (friction),
 * then eases onto the nearest card and snapping comes back. A drag past a few pixels swallows the click
 * that ends it, so dragging never opens what's under the pointer.
 * `ready` re-attaches it when the scroller appears later (it often renders only once data loads).
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>, ready: unknown = true) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let drag: { x: number; left: number; moved: boolean; samples: { t: number; x: number }[] } | null = null
    let glide = 0
    let restore = 0

    const stopGlide = () => {
      cancelAnimationFrame(glide)
      window.clearTimeout(restore)
    }
    const snapBack = () => {
      el.style.scrollSnapType = ''
    }

    // The nearest card's snap position (its left edge, less the scroller's scroll padding).
    const nearest = (left: number) => {
      const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0
      const max = el.scrollWidth - el.clientWidth
      const box = el.getBoundingClientRect().left + el.clientLeft
      let best = left
      let dist = Infinity
      for (const c of Array.from(el.children)) {
        const at = Math.min(max, Math.max(0, c.getBoundingClientRect().left - box + el.scrollLeft - pad))
        const d = Math.abs(at - left)
        if (d < dist) {
          dist = d
          best = at
        }
      }
      return best
    }

    const settle = () => {
      const target = nearest(el.scrollLeft)
      el.scrollTo({ left: target, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      restore = window.setTimeout(snapBack, 350)
    }

    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      stopGlide()
      drag = { x: e.clientX, left: el.scrollLeft, moved: false, samples: [{ t: e.timeStamp, x: e.clientX }] }
    }
    const move = (e: PointerEvent) => {
      if (!drag) return
      const dx = e.clientX - drag.x
      if (!drag.moved && Math.abs(dx) > 4) {
        drag.moved = true
        el.style.scrollSnapType = 'none'
        el.style.cursor = 'grabbing'
        try {
          el.setPointerCapture(e.pointerId) // keep following if the mouse leaves the row
        } catch {
          // Not a live pointer (scripted): dragging still works while over the row.
        }
      }
      if (!drag.moved) return
      el.scrollLeft = drag.left - dx
      drag.samples.push({ t: e.timeStamp, x: e.clientX })
      if (drag.samples.length > 6) drag.samples.shift()
    }
    const up = (e: PointerEvent) => {
      if (!drag) return
      const { moved, samples } = drag
      drag = null
      el.style.cursor = ''
      try {
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
      } catch {
        // Never captured.
      }
      if (!moved) {
        // A click that stopped a glide: settle where it is.
        if (el.style.scrollSnapType === 'none') settle()
        return
      }

      // The throw: speed over the last few moves (px per ms), carried on with friction.
      const a = samples[0]
      const b = samples[samples.length - 1]
      let v = b.t > a.t && e.timeStamp - b.t < 80 ? -(b.x - a.x) / (b.t - a.t) : 0
      if (prefersReducedMotion() || Math.abs(v) < 0.2) settle()
      else {
        let last = performance.now()
        const step = (now: number) => {
          const dt = Math.min(32, now - last)
          last = now
          const before = el.scrollLeft
          el.scrollLeft += v * dt
          v *= Math.pow(0.94, dt / 16)
          if (Math.abs(v) < 0.15 || el.scrollLeft === before) settle()
          else glide = requestAnimationFrame(step)
        }
        glide = requestAnimationFrame(step)
      }

      const swallow = (c: MouseEvent) => {
        c.stopPropagation()
        c.preventDefault()
      }
      el.addEventListener('click', swallow, { capture: true, once: true })
      setTimeout(() => el.removeEventListener('click', swallow, { capture: true }), 0)
    }
    // A touch or wheel takes over from a glide.
    const interrupt = () => {
      if (!drag) {
        stopGlide()
        snapBack()
      }
    }

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('wheel', interrupt, { passive: true })
    el.addEventListener('touchstart', interrupt, { passive: true })
    return () => {
      stopGlide()
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', interrupt)
      el.removeEventListener('touchstart', interrupt)
    }
  }, [ref, ready])
}
