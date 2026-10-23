'use client'

// Pattern: Bencho / Carousel, via the 100K Club Premium UI Kit (MIT, bencho.dev/licence),
// adapted to Check-in tokens and ported to React. Bencho's notes, kept where they explain a number:
//
// NOTHING EVER LEAVES THE FRAME. Cards go ROUND: out to one side, back and small, round to the
// other side, forward again. So the ring is endless: no first card, no last, no rubber band.
//
// THE ANGLE IS NOT TAKEN MODULO ANYTHING. `turn` counts up and down without limit and a card's
// angle is `(i - turn) * step`. Wrapping it would send a card the long way round at the seam.
//
// ONE TRANSFORM PER ELEMENT. The slot carries where the card is on the ring, the card carries the
// press tilt. They are owned by different things (the drag, a pair of springs), and one element
// written by two authors means one of them loses.
//
// Check-in changes: no idle drift (motion answers what people do), so there's no floater layer
// and no redraw-after-drift fix; sizes re-measured for portrait crew cards; React props for the
// knobs; a live region names the card at the front.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { prefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import styles from './RingCarousel.module.css'

export interface RingItem {
  key: string
  /** Read out when this card comes to the front ("Couch to 5K"). */
  label: string
  content: ReactNode
}

export interface RingCarouselProps {
  items: RingItem[]
  /** Names the carousel for screen readers ("Featured crews"). */
  label: string
  opensOn?: number
  /** A card settled at the front. */
  onFront?: (index: number) => void
  /** The front card was tapped, or Enter / Space was pressed. */
  onTap?: (index: number) => void
  /** Card size in px. Re-measure the stage, orbit and lean if the ratio changes a lot. */
  cardWidth?: number
  cardHeight?: number
  stageWidth?: number
  stageHeight?: number
  /** How far the cards swing out to the sides, px. */
  orbit?: number
  /** How much higher a card at the back sits than one at the front, px. */
  lean?: number
  /** How much smaller the back of the ring is: 100 puts the back card at half size. */
  depth?: number
  className?: string
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const mod = (a: number, n: number) => ((a % n) + n) % n
const out = (t: number) => 1 - Math.pow(1 - t, 4) // quart-out: fast start, soft landing

// One spring for everything that settles, in frames (sixtieths of a second). The damping is
// RAISED to dt rather than multiplied, so a dropped frame decays the same energy as the two it
// replaced. Tune 50: damping ratio ~0.41.
const SPRING = { k: 0.16, d: 0.72 }
const PULL = 170 // px of drag that turn the ring one position
const TOSS = 150 // how far ahead of the release a throw looks, ms of travel
const MOST = 2 // how many cards a flick may skip before you lose your place
const SETTLE_MS = 620
const SINK = 0.5 // how far a pressed card gives (0..1)
// Every card sits at its own small angle: no pattern, no symmetry, no alternation.
const ANGLE = [-2.6, 1.8, -1.1, 2.9, 1.3, -1.9, 2.2]

type Spring = { cur: number; vel: number }

export function RingCarousel({
  items,
  label,
  opensOn = 0,
  onFront,
  onTap,
  cardWidth = 240,
  cardHeight = 280,
  stageWidth = 760,
  stageHeight = 380,
  orbit = 250,
  lean = 48,
  depth = 60,
  className,
}: RingCarouselProps) {
  const wrap = useRef<HTMLDivElement>(null)
  const car = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const slots = useRef<(HTMLDivElement | null)[]>([])
  const cards = useRef<(HTMLDivElement | null)[]>([])
  const sheens = useRef<(HTMLSpanElement | null)[]>([])
  const [front, setFront] = useState(opensOn)
  const callbacks = useRef({ onFront, onTap })
  useEffect(() => {
    callbacks.current = { onFront, onTap }
  })

  const N = items.length

  useEffect(() => {
    const root = wrap.current
    const stage = car.current
    const tr = track.current
    if (!root || !stage || !tr || !N) return
    const still = prefersReducedMotion()

    // ── where a card sits, given where the ring is ──
    // `f` is the whole of it: 1 at the front, 0 at the back. It drives size, lean and paint order.
    const spotOf = (i: number, turn: number) => {
      const th = (i - turn) * ((Math.PI * 2) / N)
      const f = (Math.cos(th) + 1) / 2
      return {
        x: Math.sin(th) * orbit,
        y: -(1 - f) * lean,
        s: mix(1 - clamp(depth, 0, 150) / 200, 1, f),
        z: Math.round(f * 100),
      }
    }

    let turn = opensOn
    let raf = 0
    let springRaf = 0
    let prevT = 0
    let held = false
    let downSlot = -1
    let drag: { x0: number; t0: number; last: number; t: number; vx: number; moved: boolean } | null = null
    const frontIndex = () => mod(Math.round(turn), N)

    // No opacity is written: size, lean and paint order say which is in front.
    const paint = () =>
      slots.current.forEach((el, i) => {
        if (!el) return
        const sp = spotOf(i, turn)
        el.style.transform = `translate(-50%, -50%) translate(${sp.x.toFixed(2)}px, ${sp.y.toFixed(2)}px) rotate(${ANGLE[i % ANGLE.length]}deg) scale(${sp.s.toFixed(4)})`
        el.style.zIndex = String(sp.z)
      })

    // ── the press: it SINKS, it does not lift. The point you're over goes away. ──
    const state = items.map(() => ({ pt: { x: 0, y: 0 }, on: false, sx: { cur: 0, vel: 0 }, sy: { cur: 0, vel: 0 }, lit: { cur: 0, vel: 0 } }))
    const drawCard = (i: number) => {
      const card = cards.current[i]
      const c = state[i]
      if (!card) return
      const max = SINK * 13
      const lit = c.lit.cur
      // At rest the card carries no transform at all: a translateZ(0) would keep a 3D layer
      // drawn at whatever size it had, and a card turned to the front would stay soft.
      const atRest = lit === 0 && c.sx.cur === 0 && c.sy.cur === 0
      card.style.transform = atRest
        ? 'none'
        : `translateZ(${(-10 * SINK * lit).toFixed(2)}px) rotateX(${(-c.sy.cur * max).toFixed(2)}deg) rotateY(${(c.sx.cur * max).toFixed(2)}deg)`
      const sheen = sheens.current[i]
      if (sheen) {
        // The pointer as a percentage, so the gradient lands in the same place at any scale.
        // Dent and rim are shade and light, not palette colors.
        const px = ((c.sx.cur + 1) / 2) * 100
        const py = ((c.sy.cur + 1) / 2) * 100
        const dark = SINK * 0.35 * lit
        const rim = SINK * 0.16 * lit
        sheen.style.backgroundImage =
          `radial-gradient(44% 36% at ${px.toFixed(1)}% ${py.toFixed(1)}%, rgb(0 0 0 / ${dark.toFixed(3)}) 0%, transparent 100%), ` +
          `radial-gradient(54% 44% at ${(100 - px).toFixed(1)}% ${(100 - py).toFixed(1)}%, rgb(255 255 255 / ${rim.toFixed(3)}) 0%, transparent 100%)`
      }
    }

    // One loop for every card's springs; it parks itself once everything has settled.
    const step = (sp: Spring, target: number, dt: number) => {
      sp.vel += (target - sp.cur) * SPRING.k * dt
      sp.vel *= Math.pow(SPRING.d, dt)
      sp.cur += sp.vel * dt
      if (Math.abs(target - sp.cur) < 0.002 && Math.abs(sp.vel) < 0.002) {
        sp.cur = target
        sp.vel = 0
        return true
      }
      return false
    }
    const springTick = (t: number) => {
      const dt = prevT ? clamp((t - prevT) / 16.67, 0, 2.5) : 1
      prevT = t
      let busy = false
      state.forEach((c, i) => {
        const live = c.on && !held
        const a = step(c.sx, live ? c.pt.x : 0, dt)
        const b = step(c.sy, live ? c.pt.y : 0, dt)
        const l = step(c.lit, live ? 1 : 0, dt)
        if (!(a && b && l)) busy = true
        drawCard(i)
      })
      if (busy) springRaf = requestAnimationFrame(springTick)
      else {
        springRaf = 0
        prevT = 0
      }
    }
    const wake = () => {
      if (!still && !springRaf) springRaf = requestAnimationFrame(springTick)
    }

    const cleanups: (() => void)[] = []
    if (!still) {
      cards.current.forEach((card, i) => {
        if (!card) return
        const move = (e: PointerEvent) => {
          const b = card.getBoundingClientRect()
          state[i].pt = { x: clamp(((e.clientX - b.left) / b.width) * 2 - 1, -1, 1), y: clamp(((e.clientY - b.top) / b.height) * 2 - 1, -1, 1) }
          state[i].on = true
          wake()
        }
        // `out` with a containment test, so a pointer that leaves with no related target still lets go.
        const leave = (e: PointerEvent) => {
          const to = e.relatedTarget as Node | null
          if (!to || !card.contains(to)) {
            state[i].on = false
            wake()
          }
        }
        const cancel = () => {
          state[i].on = false
          wake()
        }
        card.addEventListener('pointermove', move)
        card.addEventListener('pointerout', leave)
        card.addEventListener('pointercancel', cancel)
        cleanups.push(() => {
          card.removeEventListener('pointermove', move)
          card.removeEventListener('pointerout', leave)
          card.removeEventListener('pointercancel', cancel)
        })
      })
    }

    // ── the settle: quart-out from wherever the ring is now to a whole position ──
    // It reads its start from the live value, so a second swipe during one turns it further.
    const glide = (to: number) => {
      cancelAnimationFrame(raf)
      const from = turn
      const done = () => {
        const f = frontIndex()
        setFront(f)
        callbacks.current.onFront?.(f)
      }
      if (still || from === to) {
        turn = to
        paint()
        done()
        return
      }
      const t0 = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / SETTLE_MS)
        turn = mix(from, to, out(p))
        paint()
        if (p < 1) raf = requestAnimationFrame(tick)
        else {
          raf = 0
          done()
        }
      }
      raf = requestAnimationFrame(tick)
    }
    const go = (d: number) => glide(Math.round(turn) + d)
    // The shortest way round to a card, for a tap on one that isn't at the front.
    const goTo = (i: number) => {
      const cur = Math.round(turn)
      let d = mod(i - cur, N)
      if (d > N / 2) d -= N
      glide(cur + d)
    }

    const onDown = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      const slot = (e.target as Element | null)?.closest?.('[data-slot]')
      downSlot = slot ? Number(slot.getAttribute('data-slot')) : -1
      drag = { x0: e.clientX, t0: turn, last: e.clientX, t: e.timeStamp, vx: 0, moved: false }
      held = true
      tr.setAttribute('data-held', 'true')
      wake()
      try {
        tr.setPointerCapture(e.pointerId)
      } catch {
        // Not a live pointer.
      }
    }
    const onMove = (e: PointerEvent) => {
      const g = drag
      if (!g) return
      const dx = e.clientX - g.x0
      if (!g.moved && Math.abs(dx) > 3) g.moved = true
      // px per ms, smoothed against the previous reading so one jittery frame can't fake a flick,
      // and measured from the LAST position: the speed at release says how far it meant to go.
      const dt = Math.max(1, e.timeStamp - g.t)
      g.vx = (g.vx + (e.clientX - g.last) / dt) / 2
      g.last = e.clientX
      g.t = e.timeStamp
      turn = g.t0 - dx / PULL // no rubber band, because there is no end
      paint()
    }
    const onUp = () => {
      const g = drag
      if (!g) return
      drag = null
      held = false
      tr.setAttribute('data-held', 'false')
      wake()
      // A press that never moved is a tap: the front card opens, any other card comes round.
      if (!g.moved) {
        if (downSlot >= 0 && downSlot === frontIndex()) {
          glide(Math.round(turn))
          callbacks.current.onTap?.(downSlot)
        } else if (downSlot >= 0) goTo(downSlot)
        else glide(Math.round(turn))
        return
      }
      const carry = clamp((-g.vx * TOSS) / PULL, -MOST, MOST)
      glide(Math.round(turn + carry))
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        callbacks.current.onTap?.(frontIndex())
        return
      }
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
      if (!d) return
      e.preventDefault()
      go(d)
    }
    tr.addEventListener('pointerdown', onDown)
    tr.addEventListener('pointermove', onMove)
    tr.addEventListener('pointerup', onUp)
    tr.addEventListener('pointercancel', onUp)
    tr.addEventListener('keydown', onKey)

    // ── fitting the stage to the column ──
    // Wide enough: the whole ring at its own size. Narrower (phones): the FRONT card is fitted to
    // the column and the side cards run off the edges, clipped. A card nobody can read is the worse failure.
    stage.style.width = `${stageWidth}px`
    stage.style.height = `${stageHeight}px`
    const fit = () => {
      const w = root.clientWidth || stageWidth
      const s = w >= stageWidth ? 1 : Math.min(1, w / (cardWidth + 40))
      root.style.overflow = w >= stageWidth ? 'visible' : 'hidden'
      stage.style.transform = `translateX(-50%) scale(${s.toFixed(4)})`
      root.style.height = `${Math.round(stageHeight * s)}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(root)

    paint()
    state.forEach((_, i) => drawCard(i))

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(springRaf)
      tr.removeEventListener('pointerdown', onDown)
      tr.removeEventListener('pointermove', onMove)
      tr.removeEventListener('pointerup', onUp)
      tr.removeEventListener('pointercancel', onUp)
      tr.removeEventListener('keydown', onKey)
      cleanups.forEach((f) => f())
      ro.disconnect()
    }
    // The ring rebuilds when the set of cards or its measurements change, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N, opensOn, cardWidth, cardHeight, stageWidth, stageHeight, orbit, lean, depth])

  return (
    <div ref={wrap} className={cn(styles.wrap, className)}>
      <div ref={car} className={styles.car}>
        <div
          ref={track}
          className={styles.track}
          role="group"
          aria-roledescription="carousel"
          aria-label={`${label}. Use the left and right arrow keys to turn it.`}
          tabIndex={0}
        >
          {items.map((item, i) => (
            <div
              key={item.key}
              ref={(el) => {
                slots.current[i] = el
              }}
              data-slot={i}
              className={styles.slot}
              style={{ width: cardWidth, height: cardHeight }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${item.label}, ${i + 1} of ${N}`}
              aria-hidden={i !== front}
            >
              <div
                ref={(el) => {
                  cards.current[i] = el
                }}
                className={styles.card}
              >
                {item.content}
                <span
                  ref={(el) => {
                    sheens.current[i] = el
                  }}
                  aria-hidden="true"
                  className={styles.sheen}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {items[front] ? `${items[front].label}, ${front + 1} of ${N}` : ''}
      </span>
    </div>
  )
}
