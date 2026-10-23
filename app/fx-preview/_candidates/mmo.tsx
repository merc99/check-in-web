'use client'

// Candidate ports of mmo-fx-kit/fx.js for the /fx-preview comparison: tilt, particle burst,
// fly to target, hold to confirm, toast stack and the synthesized sounds. Behavior follows the kit;
// whatever wins moves into components/fx after review.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'
import { prefersReducedMotion } from '@/lib/motion'
import styles from './mmo.module.css'

const finePointer = () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

// ── tilt: writes --rx/--ry (rotation) and --gx/--gy (pointer, for the foil) ──
export function useMmoTilt(ref: RefObject<HTMLElement | null>, maxTilt = 12) {
  useEffect(() => {
    const el = ref.current
    if (!el || !finePointer() || prefersReducedMotion()) return
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      el.style.setProperty('--rx', `${((0.5 - y) * maxTilt * 0.83).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${((x - 0.5) * maxTilt).toFixed(2)}deg`)
      el.style.setProperty('--gx', `${x * 100}%`)
      el.style.setProperty('--gy', `${y * 100}%`)
      el.setAttribute('data-tilting', '')
    }
    const leave = () => {
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
      el.removeAttribute('data-tilting')
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [ref, maxTilt])
}

// ── particle burst on one shared canvas ──
let canvas: HTMLCanvasElement | null = null
let c2d: CanvasRenderingContext2D | null = null
let parts: { x: number; y: number; vx: number; vy: number; life: number; size: number; c: string }[] = []
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
    p.vy += 0.18
    p.vx *= 0.98
    p.life -= 0.016
    c2d.globalAlpha = Math.max(0, p.life)
    c2d.fillStyle = p.c
    c2d.fillRect(p.x, p.y, p.size, p.size)
  }
  parts = parts.filter((p) => p.life > 0)
  if (parts.length) requestAnimationFrame(tick)
  else {
    running = false
    c2d.clearRect(0, 0, innerWidth, innerHeight)
  }
}
/** Colors: CSS variable names (`--sky`, read from the live theme) or plain colors (`white`). */
export function burstFrom(el: Element, cssVars: string[], count = 60) {
  if (prefersReducedMotion()) return
  ensureCanvas()
  const cs = getComputedStyle(document.documentElement)
  const colors = cssVars.map((v) => (v.startsWith('--') ? cs.getPropertyValue(v).trim() || 'white' : v))
  const r = el.getBoundingClientRect()
  const x = r.left + r.width / 2
  const y = r.top + r.height / 2
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const v = 2 + Math.random() * 6
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, life: 1, size: 2 + Math.random() * 3, c: colors[i % colors.length] })
  }
  if (!running) {
    running = true
    requestAnimationFrame(tick)
  }
}

// ── fly to target: "+1" floats up from where it was earned and lands on a counter, which pulses ──
export function flyTo(from: Element, to: HTMLElement, text: string, onLand?: () => void) {
  const pulse = () => {
    to.classList.remove(styles.pulse)
    void to.offsetWidth
    to.classList.add(styles.pulse)
    onLand?.()
  }
  if (prefersReducedMotion()) return pulse()
  const a = from.getBoundingClientRect()
  const b = to.getBoundingClientRect()
  const p = document.createElement('div')
  p.className = styles.fly
  p.textContent = text
  document.body.appendChild(p)
  const x0 = a.left + a.width / 2
  const y0 = a.top
  const x1 = b.left + b.width / 2
  const y1 = b.top + b.height / 2
  p.style.left = `${x0}px`
  p.style.top = `${y0}px`
  p.animate(
    [
      { transform: 'translate(-50%,0) scale(.8)', opacity: 0 },
      { transform: 'translate(-50%,-46px) scale(1.1)', opacity: 1, offset: 0.25 },
      { transform: `translate(calc(-50% + ${x1 - x0}px),${y1 - y0}px) scale(.7)`, opacity: 0.9 },
    ],
    { duration: 900, easing: 'cubic-bezier(.5,0,.3,1)' },
  ).onfinish = () => {
    p.remove()
    pulse()
  }
}

// ── hold to confirm: fills over `duration`, works with Space / Enter ──
export function useHold(onComplete: () => void, duration = 900) {
  const ref = useRef<HTMLButtonElement>(null)
  const done = useRef(onComplete)
  useEffect(() => {
    done.current = onComplete
  })
  useEffect(() => {
    const btn = ref.current
    if (!btn) return
    let raf = 0
    let start = 0
    let holding = false
    const set = (v: number) => btn.style.setProperty('--hold', String(v))
    const begin = () => {
      if (btn.disabled || holding) return
      holding = true
      start = performance.now()
      sfx('charge')
      const f = (now: number) => {
        if (!holding) return
        const k = Math.min(1, (now - start) / duration)
        set(k)
        if (k >= 1) {
          holding = false
          set(0)
          done.current()
          return
        }
        raf = requestAnimationFrame(f)
      }
      raf = requestAnimationFrame(f)
    }
    const cancel = () => {
      if (!holding) return
      holding = false
      cancelAnimationFrame(raf)
      set(0)
    }
    const down = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
        e.preventDefault()
        begin()
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') cancel()
    }
    btn.addEventListener('pointerdown', begin)
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, cancel)
    btn.addEventListener('keydown', down)
    btn.addEventListener('keyup', up)
    return () => {
      cancel()
      btn.removeEventListener('pointerdown', begin)
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.removeEventListener(ev, cancel)
      btn.removeEventListener('keydown', down)
      btn.removeEventListener('keyup', up)
    }
  }, [duration])
  return ref
}

// ── toast stack: batches messages that arrive together, pauses on hover, up to three ──
type Toast = { id: number; lines: string[]; bye?: boolean }
let pushToast: ((msg: string) => void) | null = null
export const mmoToast = (msg: string) => pushToast?.(msg)
export function MmoToasts() {
  const [list, setList] = useState<Toast[]>([])
  const buffer = useRef<string[] | null>(null)
  useEffect(() => {
    let id = 0
    pushToast = (msg) => {
      if (buffer.current) return void buffer.current.push(msg)
      buffer.current = [msg]
      setTimeout(() => {
        const lines = buffer.current ?? []
        buffer.current = null
        setList((l) => [{ id: ++id, lines }, ...l].slice(0, 3))
      }, 180)
    }
    return () => {
      pushToast = null
    }
  }, [])
  const kill = useCallback((id: number) => {
    setList((l) => l.map((t) => (t.id === id ? { ...t, bye: true } : t)))
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 300)
  }, [])
  return (
    <div className={styles.toasts} role="status" aria-live="polite">
      {list.map((t) => (
        <ToastItem key={t.id} toast={t} onKill={() => kill(t.id)} />
      ))}
    </div>
  )
}
function ToastItem({ toast, onKill }: { toast: Toast; onKill: () => void }) {
  const timer = useRef(0)
  const arm = useCallback(() => {
    timer.current = window.setTimeout(onKill, 4200)
  }, [onKill])
  useEffect(() => {
    arm()
    return () => clearTimeout(timer.current)
  }, [arm])
  const lines = toast.lines.length > 3 ? [...toast.lines.slice(0, 3), `and ${toast.lines.length - 3} more`] : toast.lines
  return (
    <div
      className={styles.toast}
      data-bye={toast.bye ? '' : undefined}
      onMouseEnter={() => clearTimeout(timer.current)}
      onMouseLeave={arm}
      onClick={onKill}
    >
      {lines.map((l, i) => (
        <div key={i} className={styles.line}>
          {l}
        </div>
      ))}
    </div>
  )
}

// ── sounds: synthesized with Web Audio, off until turned on, choice saved ──
let ctx: AudioContext | null = null
let soundOn = false
const listeners = new Set<() => void>()
if (typeof window !== 'undefined') {
  try {
    soundOn = localStorage.getItem('fx-sound') === '1'
  } catch {
    // Blocked storage: sound stays off.
  }
}
const ac = () => ctx ?? (ctx = new AudioContext())
function tone(f: number, t0: number, d: number, type: OscillatorType = 'triangle', v = 0.07) {
  const a = ac()
  const o = a.createOscillator()
  const g = a.createGain()
  const t = a.currentTime + t0
  o.type = type
  o.frequency.setValueAtTime(f, t)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(v, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + d)
  o.connect(g).connect(a.destination)
  o.start(t)
  o.stop(t + d + 0.02)
}
function chargeUp(secs = 0.9) {
  const a = ac()
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(200, a.currentTime)
  o.frequency.exponentialRampToValueAtTime(900, a.currentTime + secs)
  g.gain.setValueAtTime(0.03, a.currentTime)
  g.gain.linearRampToValueAtTime(0, a.currentTime + secs + 0.05)
  o.connect(g).connect(a.destination)
  o.start()
  o.stop(a.currentTime + secs + 0.1)
}
export const SOUNDS = {
  tap: () => tone(1600, 0, 0.03, 'sine', 0.02),
  success: () => {
    tone(784, 0, 0.12)
    tone(1175, 0.1, 0.25)
  },
  reward: () => {
    tone(880, 0, 0.12)
    tone(1320, 0.07, 0.18)
  },
  confirm: () => {
    tone(523, 0, 0.1)
    tone(659, 0.06, 0.1)
    tone(784, 0.12, 0.16)
  },
  charge: () => chargeUp(),
  levelUp: () => [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.3)),
  unlock: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.07, 0.22, 'square', 0.04)),
  fanfare: () => {
    ;[392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.45, 'triangle', 0.045))
    ;[523, 659, 784].forEach((f) => tone(f, 0.6, 1, 'sine', 0.03))
  },
  error: () => tone(140, 0, 0.18, 'square', 0.04),
} as const
export type SoundName = keyof typeof SOUNDS
export function sfx(name: SoundName) {
  if (!soundOn) return
  try {
    SOUNDS[name]()
  } catch {
    // Audio can fail before a user gesture; the visual is the feedback that matters.
  }
}
export function useSound() {
  const on = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => soundOn,
    () => false,
  )
  const toggle = useCallback(() => {
    soundOn = !soundOn
    try {
      localStorage.setItem('fx-sound', soundOn ? '1' : '0')
    } catch {
      // Not remembered; still works this visit.
    }
    if (soundOn) sfx('success')
    listeners.forEach((l) => l())
  }, [])
  return { on, toggle, play: sfx }
}
