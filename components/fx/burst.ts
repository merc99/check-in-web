'use client'

// Pattern: mmo fx kit / particle burst (adapted to Check-in). One shared canvas, created on first use,
// that parks itself when the last particle fades. Skipped entirely under reduced motion.
import { prefersReducedMotion } from '@/lib/motion'
import { FX } from './config'

type Particle = { x: number; y: number; vx: number; vy: number; life: number; size: number; c: string }

let canvas: HTMLCanvasElement | null = null
let c2d: CanvasRenderingContext2D | null = null
let parts: Particle[] = []
let running = false

function ensureCanvas() {
  if (canvas) return
  canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:95'
  document.body.appendChild(canvas)
  c2d = canvas.getContext('2d')
  const resize = () => {
    canvas!.width = innerWidth * devicePixelRatio
    canvas!.height = innerHeight * devicePixelRatio
  }
  resize()
  addEventListener('resize', resize)
}

function tick() {
  if (!c2d) return
  c2d.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  c2d.clearRect(0, 0, innerWidth, innerHeight)
  for (const p of parts) {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.18 // gravity
    p.vx *= 0.98 // drag
    p.life -= 0.016
    c2d.globalAlpha = Math.max(0, p.life)
    c2d.fillStyle = p.c
    c2d.beginPath()
    c2d.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2) // round, softer than the kit's squares
    c2d.fill()
  }
  parts = parts.filter((p) => p.life > 0)
  if (parts.length) requestAnimationFrame(tick)
  else {
    running = false
    c2d.clearRect(0, 0, innerWidth, innerHeight)
  }
}

/**
 * A burst from the center of `el`. Colors are CSS variable names (`--sky`, read from the live
 * theme, so dark mode gets its own values) or plain colors (`white`).
 */
export function burstFrom(el: Element, colors: string[], count: number = FX.burstCount) {
  if (prefersReducedMotion()) return
  ensureCanvas()
  const cs = getComputedStyle(document.documentElement)
  const palette = colors.map((v) => (v.startsWith('--') ? cs.getPropertyValue(v).trim() || 'white' : v))
  const r = el.getBoundingClientRect()
  const x = r.left + r.width / 2
  const y = r.top + r.height / 2
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const v = 2 + Math.random() * 6
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, life: 1, size: 3 + Math.random() * 3, c: palette[i % palette.length] })
  }
  if (!running) {
    running = true
    requestAnimationFrame(tick)
  }
}
