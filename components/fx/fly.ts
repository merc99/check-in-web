'use client'

// Pattern: Bencho / Emoji reactions' landing, via the premium UI kit (MIT): a copy arcs from where
// something was earned to where it lands, tilting on the way, and the target squashes as it lands.
// Used for reactions (emoji → chip) and the streak (+1 → streak). One way of landing a number.
import { prefersReducedMotion } from '@/lib/motion'
import { FX } from './config'

type Point = { x: number; y: number }

const center = (el: Element): Point => {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

/** The squash a target plays when something lands on it. */
export function squash(el: Element | null | undefined) {
  if (!el || prefersReducedMotion()) return
  el.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.14, .9)', offset: 0.35 }, { transform: 'scale(.96, 1.05)', offset: 0.7 }, { transform: 'scale(1)' }],
    { duration: 420, easing: 'ease-out' },
  )
}

/**
 * Fly `text` from `from` (an element or a viewport point) to `to`, then call `onLand` once.
 * Lands even if the flight never finishes (a hidden tab pauses animations). Under reduced motion it
 * lands at once. `className` styles the flying copy (font, color).
 */
export function flyArc({
  from, to, text, className, onLand, squashTarget = true,
}: { from: Element | Point; to: Element; text: string; className?: string; onLand?: () => void; squashTarget?: boolean }) {
  let landed = false
  let p: HTMLSpanElement | null = null
  const land = () => {
    if (landed) return
    landed = true
    p?.remove()
    if (squashTarget) squash(to)
    onLand?.()
  }
  if (prefersReducedMotion()) {
    land()
    return
  }
  const a = from instanceof Element ? center(from) : from
  const b = center(to)
  const mx = (a.x + b.x) / 2
  const my = Math.min(a.y, b.y) - 50
  const el = (p = document.createElement('span'))
  el.setAttribute('aria-hidden', 'true')
  el.textContent = text
  el.className = className ?? ''
  el.style.cssText += ';position:fixed;left:0;top:0;z-index:96;pointer-events:none;white-space:nowrap'
  document.body.appendChild(el)
  const at = (q: Point, s: number, r: number) => `translate(${q.x}px, ${q.y}px) translate(-50%, -50%) scale(${s}) rotate(${r}deg)`
  el.animate(
    [{ transform: at(a, 1.4, 0) }, { transform: at({ x: mx, y: my }, 1.25, -14), offset: 0.45 }, { transform: at(b, 1, 0) }],
    { duration: FX.flyMs, easing: 'cubic-bezier(0.35, 0, 0.3, 1)', fill: 'forwards' },
  ).onfinish = land
  window.setTimeout(land, FX.flyMs + 300)
}
