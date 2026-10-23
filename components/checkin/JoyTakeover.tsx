'use client'

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { HUE_CLASS, HUES } from '@/lib/colors'
import { prefersReducedMotion, useCountUp } from '@/lib/motion'

const AUTO_CLOSE_MS = 2900
const CLIP_MS = 700
const WORDS = ['You', 'showed', 'up.']

export interface JoyTakeoverProps {
  /** Viewport point the mint circle grows from (the FAB's center). */
  origin: { x: number; y: number }
  /** All-time check-in count after this one. Rolls up from count − 1. */
  count: number
  sub: string
  /** Called as soon as it starts closing (tap or timeout). */
  onDismiss: () => void
  /** Called once it's fully gone. */
  onClosed: () => void
}

/** The one celebratory moment: mint floods from the FAB, words spring in, the count rolls, confetti falls. */
export function JoyTakeover({ origin, count, sub, onDismiss, onClosed }: JoyTakeoverProps) {
  const root = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [at, setAt] = useState({ x: 0, y: 0 })
  const closed = useRef(false)
  const shown = useCountUp(count, { from: count - 1, duration: 400, delay: 650 })
  const callbacks = useRef({ onDismiss, onClosed })
  useEffect(() => {
    callbacks.current = { onDismiss, onClosed }
  })

  // Confetti is random once per takeover.
  const [confetti] = useState(() =>
    prefersReducedMotion()
      ? []
      : Array.from({ length: 42 }, (_, i) => ({
          color: HUES[i % HUES.length],
          round: i % 3 === 0,
          left: Math.random() * 100,
          rotate: Math.round(Math.random() * 900 - 450),
          duration: 1.6 + Math.random() * 1.6,
          delay: 0.25 + Math.random() * 0.5,
        })),
  )

  // Origin relative to the app column, measured before the first paint.
  useLayoutEffect(() => {
    const r = root.current?.getBoundingClientRect()
    if (r) setAt({ x: origin.x - r.left, y: origin.y - r.top })
  }, [origin.x, origin.y])

  const close = () => {
    if (closed.current) return
    closed.current = true
    callbacks.current.onDismiss()
    setOpen(false)
    setTimeout(() => callbacks.current.onClosed(), prefersReducedMotion() ? 0 : CLIP_MS)
  }

  useEffect(() => {
    let r2 = 0
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setOpen(true))
    })
    const t = setTimeout(close, AUTO_CLOSE_MS)
    return () => {
      cancelAnimationFrame(r1)
      cancelAnimationFrame(r2)
      clearTimeout(t)
    }
  }, []) // once per takeover

  return createPortal(
    <div
      ref={root}
      role="status"
      onClick={close}
      className="fixed inset-0 z-70 mx-auto grid max-w-app cursor-pointer place-items-center overflow-hidden bg-primary text-primary-foreground transition-[clip-path] duration-700 ease-out"
      style={{ clipPath: `circle(${open ? '150%' : '0px'} at ${at.x}px ${at.y}px)` }}
    >
      <div className="relative z-2 p-6 text-center">
        <div className="font-display text-[64px] leading-[.92]">
          {WORDS.map((w, i) => (
            <span key={w}>
              {i > 0 && <br />}
              <span
                className={cn('inline-block opacity-0 motion-reduce:opacity-100', open && 'animate-word')}
                style={{ animationDelay: `${0.15 + i * 0.1}s` }}
              >
                {w}
              </span>
            </span>
          ))}
        </div>
        <div
          className={cn(
            'mt-6 inline-flex items-baseline gap-2 rounded-full border border-border bg-card px-[18px] py-[10px] font-bold opacity-0 shadow-card motion-reduce:opacity-100',
            open && 'animate-word',
          )}
          style={{ animationDelay: '.55s' }}
        >
          Check-in <b className="tnum font-display text-[22px] font-normal">{shown}</b>
        </div>
        <p className={cn('mt-[14px] font-medium opacity-0 motion-reduce:opacity-100', open && 'animate-word')} style={{ animationDelay: '.7s' }}>
          {sub}
        </p>
      </div>
      {open &&
        confetti.map((c, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              'absolute top-[-30px] z-1 animate-fall border border-border',
              c.round ? 'size-4 rounded-full' : 'h-6 w-[14px] rounded-sm',
              HUE_CLASS[c.color].solid,
            )}
            style={
              {
                left: `${c.left}%`,
                '--r': `${c.rotate}deg`,
                animationDuration: `${c.duration}s`,
                animationDelay: `${c.delay}s`,
              } as CSSProperties
            }
          />
        ))}
    </div>,
    document.body,
  )
}
