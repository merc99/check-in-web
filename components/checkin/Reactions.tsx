'use client'

// Pattern: Bencho / Emoji reactions, via the 100K Club Premium UI Kit (MIT, bencho.dev/licence),
// adapted to Check-in tokens and ported to React.
//
// What it does (Bencho's design, kept):
// - The smiley button opens a pill of emoji that rise in one by one. The one under the pointer
//   swells (one at a time, never a smear) and a small label names it.
// - Picking one makes a copy FLY in an arc to its chip, land with a squash, and the count ROLLS
//   like an odometer. The chip is laid out first with its emoji held back, so the landing spot is
//   a real measured place.
// - Each emoji arrives its own way (the fire flickers, the clap beats, the flex flexes).
// - Touch: hold the button, slide along the pill, lift on an emoji to pick it. A quick tap toggles.
//
// Check-in changes: a crew set (no party popper: multi-color confetti belongs to the joy takeover
// alone), mint for the chips you're in, chips sized like the post's heart pill, and the state is
// controlled by the parent (`chips` in, `onReact` out) so it can come from the data layer.
import { SmilePlus } from 'lucide-react'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import type { ReactionCount } from '@/lib/data'
import { prefersReducedMotion } from '@/lib/motion'
import { REACTIONS } from '@/lib/reactions'
import { cn } from '@/lib/utils'
import styles from './Reactions.module.css'

/** Each emoji's arrival animation (Reactions.module.css). The set itself lives in lib/reactions.ts. */
const KIND: Record<string, string> = {
  '❤️': 'heart',
  '💪': 'flex',
  '🔥': 'flicker',
  '👏': 'beat',
  '🙌': 'raise',
  '🙏': 'nod',
  '😅': 'droop',
}

/** The picker: emoji, label and arrival, in order. */
export const REACTION_SET = REACTIONS.map((r) => ({ e: r.emoji, label: r.label, k: KIND[r.emoji] ?? 'nod' }))

export type ReactionChip = ReactionCount

export interface ReactionsProps {
  chips: ReactionChip[]
  /** Add (`on`) or take back your reaction. The parent updates `chips`. */
  onReact: (emoji: string, on: boolean) => void
  className?: string
}

const SPRING = 'cubic-bezier(0.24, 1.34, 0.38, 1)'
const CELL = 36 // one picker cell, px (matches .emo)
const PAD = 6 // the pill's padding, px
const MAGNIFY = 1.17 // the emoji under the pointer: a gentle lift, not a balloon
const HOLD_MS = 260 // a finger held this long opens the pill
const DIGITS = '0123456789'.split('')

const kindOf = (e: string) => REACTION_SET.find((s) => s.e === e)?.k ?? 'nod'
const labelOf = (e: string) => REACTION_SET.find((s) => s.e === e)?.label ?? e

/** Replay an emoji's arrival (removing and re-adding the attribute restarts the animation). */
function play(el: Element | null | undefined) {
  if (!el || prefersReducedMotion()) return
  el.removeAttribute('data-play')
  void (el as HTMLElement).offsetWidth
  el.setAttribute('data-play', '')
  window.setTimeout(() => el.removeAttribute('data-play'), 720)
}

/** A count whose digits roll. Columns are keyed from the right, so 9 → 10 adds a column on the left. */
function Count({ n }: { n: number }) {
  const s = String(Math.max(0, n))
  return (
    <span className={styles.count} aria-hidden="true">
      {s.split('').map((d, i) => (
        <span key={s.length - i} className={styles.col}>
          <span className={styles.strip} style={{ transform: `translateY(${-Number(d) * 1.4}em)` }}>
            {DIGITS.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  )
}

export function Reactions({ chips, onReact, className }: ReactionsProps) {
  const root = useRef<HTMLDivElement>(null)
  const row = useRef<HTMLDivElement>(null)
  const add = useRef<HTMLButtonElement>(null)
  const pill = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [on, setOn] = useState(-1)
  /** A pick waiting for its chip to be laid out, with where the flying copy starts. */
  const [landing, setLanding] = useState<{ e: string; from: { x: number; y: number } } | null>(null)
  /** The emoji in the air: its chip holds the emoji back and shows the old count until it lands. */
  const [flying, setFlying] = useState<string | null>(null)
  const positions = useRef(new Map<string, { x: number; y: number }>())
  const mounted = useRef(false)
  const hold = useRef({ timer: 0, sliding: false, touch: false })
  const keyboardOpen = useRef(false)
  /** Counts openings, so a close that lands after a reopen leaves the new pill alone. */
  const opens = useRef(0)

  /** A point on the page, in the block's own pixels. */
  const local = (r: DOMRect) => {
    const b = root.current!.getBoundingClientRect()
    return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top }
  }
  const chipEmoji = (e: string) => row.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(e)}"] [data-emoji]`) ?? null

  // Layout animation (framer's `layout`, by hand): every chip that moved plays from where it was.
  // Positions are offsets inside the row, so scrolling the page never reads as movement.
  useLayoutEffect(() => {
    const still = prefersReducedMotion()
    const next = new Map<string, { x: number; y: number }>()
    for (const el of Array.from(row.current?.children ?? []) as HTMLElement[]) {
      const key = el.dataset.key
      if (!key) continue
      const pos = { x: el.offsetLeft, y: el.offsetTop }
      next.set(key, pos)
      if (still || !mounted.current) continue
      const was = positions.current.get(key)
      if (!was) {
        el.animate([{ opacity: 0, transform: 'scale(0.5)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: SPRING })
        continue
      }
      const dx = was.x - pos.x
      const dy = was.y - pos.y
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 420, easing: SPRING })
      }
    }
    positions.current = next
    mounted.current = true
  }, [chips])

  // A pick whose chip is now laid out: send the copy there in an arc, then land it.
  useLayoutEffect(() => {
    if (!landing) return
    const c = chips.find((x) => x.emoji === landing.e)
    const target = chipEmoji(landing.e)
    if (!c?.mine || !target || !root.current) return
    setLanding(null)
    setFlying(landing.e)
    const to = local(target.getBoundingClientRect())
    const at = landing.from
    const fly = document.createElement('span')
    fly.className = styles.fly
    fly.setAttribute('aria-hidden', 'true')
    fly.textContent = landing.e
    root.current.appendChild(fly)
    const mx = (at.x + to.x) / 2
    const my = Math.min(at.y, to.y) - 46
    const anim = fly.animate(
      [
        { transform: `translate(${at.x}px, ${at.y}px) scale(1.4) rotate(0deg)` },
        { transform: `translate(${mx}px, ${my}px) scale(1.25) rotate(-14deg)`, offset: 0.45 },
        { transform: `translate(${to.x}px, ${to.y}px) scale(1) rotate(0deg)` },
      ],
      { duration: 600, easing: 'cubic-bezier(0.35, 0, 0.3, 1)', fill: 'forwards' },
    )
    const e = landing.e
    // Land once: when the flight ends, or after a beat if it never does (a hidden tab pauses
    // animations, and the chip must not sit on the old count until someone comes back).
    let landed = false
    const land = () => {
      if (landed) return
      landed = true
      fly.remove()
      setFlying(null)
      const chip = row.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(e)}"]`)
      chip?.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.14, 0.9)', offset: 0.35 }, { transform: 'scale(0.96, 1.05)', offset: 0.7 }, { transform: 'scale(1)' }],
        { duration: 420, easing: 'ease-out' },
      )
      play(chipEmoji(e)?.firstElementChild)
    }
    anim.onfinish = land
    window.setTimeout(land, 900)
  }, [chips, landing])

  // ── the pill ──
  const show = (viaKeyboard = false) => {
    opens.current++
    keyboardOpen.current = viaKeyboard
    setOpen(true)
  }
  const hide = () => {
    setOn(-1)
    const p = pill.current
    if (!p || prefersReducedMotion()) return setOpen(false)
    const opening = opens.current
    const close = () => {
      if (opens.current === opening) setOpen(false) // not if it was reopened meanwhile
    }
    p.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }).onfinish = close
    window.setTimeout(close, 250) // in case the fade never finishes (hidden tab)
  }

  // Opening: the pill grows out of the button and the emoji rise in, one after another.
  useLayoutEffect(() => {
    const p = pill.current
    if (!open || !p) return
    if (!prefersReducedMotion()) {
      p.animate([{ opacity: 0, transform: 'translateY(6px) scale(0.6)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: SPRING })
      Array.from(p.querySelectorAll('button')).forEach((b, i) =>
        b.animate(
          [{ opacity: 0, transform: 'translateY(8px) scale(0.5)', filter: 'blur(3px)' }, { opacity: 1, transform: 'none', filter: 'blur(0px)' }],
          { duration: 260, delay: 20 + i * 18, easing: SPRING, fill: 'backwards' },
        ),
      )
    }
    if (keyboardOpen.current) p.querySelector('button')?.focus()
  }, [open])

  // While open, a press anywhere else or Escape shuts it.
  useEffect(() => {
    if (!open) return
    const away = (e: globalThis.PointerEvent) => {
      const t = e.target as Node
      if (!add.current?.contains(t) && !pill.current?.contains(t)) hide()
    }
    const esc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        hide()
        add.current?.focus()
      }
    }
    document.addEventListener('pointerdown', away, true)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', away, true)
      document.removeEventListener('keydown', esc)
    }
  })

  // The emoji under the pointer plays its arrival as it swells.
  useEffect(() => {
    if (on >= 0) play(pill.current?.querySelectorAll('[data-k]')[on])
  }, [on])

  /** Which cell a point is over, or -1 off the pill. */
  const cellAt = (clientX: number) => {
    const p = pill.current
    if (!p) return -1
    const b = p.getBoundingClientRect()
    const x = clientX - b.left
    if (x < 0 || x > b.width) return -1
    return Math.max(0, Math.min(REACTION_SET.length - 1, Math.floor((x - PAD) / CELL)))
  }

  // ── picking ──
  const pick = (e: string, from: Element) => {
    const at = local(from.getBoundingClientRect())
    hide()
    const had = chips.find((c) => c.emoji === e)
    if (had?.mine) return
    if (!prefersReducedMotion()) setLanding({ e, from: at })
    onReact(e, true)
  }

  // Pressing a chip: join it (and play its arrival) or take yourself off.
  const press = (c: ReactionChip) => {
    if (!c.mine) play(chipEmoji(c.emoji)?.firstElementChild)
    onReact(c.emoji, !c.mine)
  }

  // ── the button: a mouse clicks, a finger holds and slides ──
  const addDown = (e: PointerEvent<HTMLButtonElement>) => {
    hold.current.touch = e.pointerType === 'touch' || e.pointerType === 'pen'
    if (!hold.current.touch) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // A scripted pointer can't be captured; the tap still works.
    }
    window.clearTimeout(hold.current.timer)
    hold.current.sliding = false
    hold.current.timer = window.setTimeout(() => {
      hold.current.sliding = true
      show()
    }, HOLD_MS)
  }
  const addMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (hold.current.sliding) setOn(cellAt(e.clientX))
  }
  const addUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!hold.current.touch) return
    window.clearTimeout(hold.current.timer)
    if (hold.current.sliding) {
      // Lifted: on an emoji picks it, anywhere else lets go.
      hold.current.sliding = false
      const i = cellAt(e.clientX)
      const el = i >= 0 ? pill.current?.querySelectorAll('button')[i] : null
      if (el) pick(REACTION_SET[i].e, el)
      else hide()
      return
    }
    if (open) hide()
    else show()
  }
  const addClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (hold.current.touch) {
      hold.current.touch = false // a touch was handled on the way up
      return
    }
    if (open) hide()
    else show(e.detail === 0) // detail 0: Enter or Space, so move focus into the pill
  }

  // Arrow keys move along the pill.
  const pillKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const items = Array.from(pill.current?.querySelectorAll('button') ?? [])
    const i = items.indexOf(document.activeElement as HTMLButtonElement)
    const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length
    items[n]?.focus()
  }

  return (
    <div ref={root} className={cn(styles.root, className)}>
      <div ref={row} className={styles.row}>
        {chips.map((c) => {
          const shown = flying === c.emoji ? c.count - 1 : c.count
          return (
            <button
              key={c.emoji}
              data-key={c.emoji}
              type="button"
              className={styles.chip}
              aria-pressed={c.mine}
              aria-label={`${labelOf(c.emoji)}, ${shown}${c.mine ? ', including you' : ''}`}
              onClick={() => press(c)}
            >
              <span data-emoji="" className={styles.chipEmoji} data-landing={flying === c.emoji ? '' : undefined}>
                <i className={styles.p} data-k={kindOf(c.emoji)}>
                  {c.emoji}
                </i>
              </span>
              <Count n={shown} />
            </button>
          )
        })}
        <button
          ref={add}
          data-key="__add"
          type="button"
          className={styles.add}
          aria-label="Add a reaction"
          aria-haspopup="menu"
          aria-expanded={open}
          onPointerDown={addDown}
          onPointerMove={addMove}
          onPointerUp={addUp}
          onPointerCancel={addUp}
          onContextMenu={(e) => e.preventDefault()}
          onClick={addClick}
        >
          <SmilePlus size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div
          ref={pill}
          role="menu"
          aria-label="Reactions"
          className={styles.pill}
          onPointerMove={(e) => setOn(cellAt(e.clientX))}
          onPointerLeave={() => setOn(-1)}
          onKeyDown={pillKey}
        >
          {REACTION_SET.map((m, i) => (
            <button
              key={m.e}
              type="button"
              role="menuitem"
              aria-label={m.label}
              className={styles.emo}
              onClick={(e) => pick(m.e, e.currentTarget)}
              onFocus={() => setOn(i)}
            >
              <span style={{ '--s': i === on && !prefersReducedMotion() ? MAGNIFY : 1 } as CSSProperties}>
                <i className={styles.p} data-k={m.k}>
                  {m.e}
                </i>
              </span>
            </button>
          ))}
          <span
            aria-hidden="true"
            className={styles.tip}
            style={on >= 0 ? { left: PAD + on * CELL + CELL / 2, opacity: 1 } : undefined}
          >
            {on >= 0 ? REACTION_SET[on].label : ''}
          </span>
        </div>
      )}
    </div>
  )
}
