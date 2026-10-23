'use client'

import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

const CLOSE_MS = 420 // a little under the 500ms open spring; the tail of the spring is off screen
const DISMISS_PX = 110
const DISMISS_VELOCITY = 0.6 // px per ms
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

export interface SheetProps {
  open: boolean
  onClose: () => void
  /** Large display title. Also labels the dialog. */
  title?: ReactNode
  /** Sits at the right end of the title row (e.g. the crew chip). */
  aside?: ReactNode
  /** Accessible name when there's no visible title. */
  label?: string
  children: ReactNode
}

/** Bottom sheet: spring open, drag the handle down (or flick) to dismiss, Escape closes, focus stays inside. */
export function Sheet({ open, onClose, title, aside, label, children }: SheetProps) {
  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y0: number; dy: number; t0: number } | null>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })
  const titleId = useId()

  // Opening mounts right away (during render); closing unmounts after the slide-out.
  if (open && !mounted) setMounted(true)
  const shown = open && entered

  // Flip to `entered` two frames after mounting so the transform transition runs.
  useEffect(() => {
    if (open) {
      let r2 = 0
      const r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setEntered(true))
      })
      return () => {
        cancelAnimationFrame(r1)
        cancelAnimationFrame(r2)
      }
    }
    const t = setTimeout(() => {
      setEntered(false)
      setMounted(false)
    }, CLOSE_MS)
    return () => clearTimeout(t)
  }, [open])

  // While open: lock page scroll, move focus in, trap Tab, close on Escape, restore focus after.
  useEffect(() => {
    if (!open || !mounted) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusIn = requestAnimationFrame(() => panel.current?.focus({ preventScroll: true }))

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      const el = panel.current
      if (e.key !== 'Tab' || !el) return
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === el)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !el.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(focusIn)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.({ preventScroll: true })
    }
  }, [open, mounted])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { y0: e.clientY, dy: 0, t0: performance.now() }
    e.currentTarget.setPointerCapture(e.pointerId)
    if (panel.current) panel.current.style.transition = 'none'
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || !panel.current) return
    const raw = e.clientY - d.y0
    d.dy = raw < 0 ? raw * 0.2 : raw // resist upward pulls
    panel.current.style.transform = `translateY(${d.dy}px)`
  }
  const onPointerEnd = () => {
    const d = drag.current
    if (!d || !panel.current) return
    drag.current = null
    const velocity = d.dy / Math.max(1, performance.now() - d.t0)
    panel.current.style.transition = ''
    panel.current.style.transform = ''
    if (d.dy > DISMISS_PX || velocity > DISMISS_VELOCITY) onCloseRef.current()
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-40 mx-auto max-w-app overflow-hidden">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn('absolute inset-0 bg-ink/40 transition-opacity duration-300', shown ? 'opacity-100' : 'opacity-0')}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : label}
        tabIndex={-1}
        className={cn(
          'absolute inset-x-0 bottom-0 max-h-[90%] overflow-y-auto overscroll-contain rounded-t-lg border-t border-ink bg-peach',
          'px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-1 outline-none',
          'transition-transform duration-500 ease-spring',
          shown ? 'translate-y-0' : 'translate-y-[105%]',
        )}
      >
        <div
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          className="-mx-5 grid h-7 cursor-grab touch-none place-items-center active:cursor-grabbing"
        >
          <span className="h-[5px] w-11 rounded-full bg-ink-mute" />
        </div>
        {title && (
          <div className="mb-5 flex items-center gap-3">
            <h2 id={titleId} className="font-display text-[28px] leading-none">
              {title}
            </h2>
            {aside && <div className="ml-auto">{aside}</div>}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
