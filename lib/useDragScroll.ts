'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Let a mouse drag a horizontal scroller (touch already swipes natively). Scroll snapping is paused
 * while dragging so it follows the hand, then restored so it settles on a card. A drag past a few
 * pixels swallows the click that ends it, so dragging never opens what's under the pointer.
 * `ready` re-attaches it when the scroller appears later (it often renders only once data loads).
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>, ready: unknown = true) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let drag: { x: number; left: number; moved: boolean } | null = null
    const snap = el.style.scrollSnapType

    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      drag = { x: e.clientX, left: el.scrollLeft, moved: false }
      el.style.cursor = 'grabbing'
    }
    const move = (e: PointerEvent) => {
      if (!drag) return
      const dx = e.clientX - drag.x
      if (!drag.moved && Math.abs(dx) > 4) {
        drag.moved = true
        el.style.scrollSnapType = 'none'
        try {
          el.setPointerCapture(e.pointerId) // keep following if the mouse leaves the row
        } catch {
          // Not a live pointer (scripted): dragging still works while over the row.
        }
      }
      if (drag.moved) el.scrollLeft = drag.left - dx
    }
    const up = (e: PointerEvent) => {
      if (!drag) return
      const moved = drag.moved
      drag = null
      el.style.cursor = ''
      try {
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
      } catch {
        // Never captured.
      }
      if (!moved) return
      // Settle on the nearest card: restore snapping, then nudge so the browser re-snaps.
      el.style.scrollSnapType = snap
      el.scrollBy({ left: 1 })
      el.scrollBy({ left: -1 })
      const swallow = (c: MouseEvent) => {
        c.stopPropagation()
        c.preventDefault()
      }
      el.addEventListener('click', swallow, { capture: true, once: true })
      setTimeout(() => el.removeEventListener('click', swallow, { capture: true }), 0)
    }

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [ref, ready])
}
