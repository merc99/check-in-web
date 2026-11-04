'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { BottomSheet } from '@/components/arc/bottom-sheet/bottom-sheet'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useDesktop } from '@/lib/viewport'

export interface ResponsiveSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** Hide the title visually (still read by screen readers), for sheets whose content has its own heading. */
  titleHidden?: boolean
  /** Resting heights for the phone sheet, as fractions of the viewport (Arc `detents`). */
  detents?: number[]
  children: ReactNode
}

/**
 * Arc's bottom sheet on phones, a centered dialog on desktop (lg and up). Same title, content and
 * open state either way; both close on Escape, trap focus and return it to the trigger, and the
 * browser's back (or a phone's back gesture) closes the sheet instead of leaving the page.
 */
export function ResponsiveSheet({ open, onOpenChange, title, titleHidden, description, detents, children }: ResponsiveSheetProps) {
  const desktop = useDesktop()
  useReturnFocus(open)
  useBackCloses(open, onOpenChange)

  if (!desktop) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange} title={title} titleHidden={titleHidden} description={description} detents={detents}>
        {children}
      </BottomSheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85dvh] gap-0 overflow-y-auto overscroll-contain p-6 sm:max-w-[480px]"
        {...(description ? {} : { 'aria-describedby': undefined })}
      >
        <DialogTitle className={titleHidden ? 'sr-only' : 'mb-5 pr-10 font-display text-[28px] font-medium leading-none tracking-tighter'}>{title}</DialogTitle>
        {description && <DialogDescription className="-mt-3 mb-5">{description}</DialogDescription>}
        {children}
      </DialogContent>
    </Dialog>
  )
}

// The last element focused outside any dialog: what opened the sheet. Tracked on the document because
// by the time the sheet's own effects run, it has already pulled focus inside.
let lastOutside: HTMLElement | null = null
let tracking = false
function trackFocus() {
  if (tracking || typeof document === 'undefined') return
  tracking = true
  document.addEventListener('focusin', (e) => {
    const t = e.target
    if (t instanceof HTMLElement && !t.closest('[role="dialog"]')) lastOutside = t
  })
}

/**
 * Hands focus back to whatever opened the sheet once it has closed and left (Radix can't when the
 * sheet is opened from state rather than its own trigger, and focus would drop to the page).
 */
function useReturnFocus(open: boolean) {
  const opener = useRef<HTMLElement | null>(null)
  useEffect(() => {
    trackFocus()
    if (open) {
      opener.current = lastOutside
      return
    }
    const el = opener.current
    if (!el) return
    opener.current = null
    // Watch while the sheet animates out: when its exit drops focus onto the page, hand it back.
    const started = performance.now()
    const t = window.setInterval(() => {
      const lost = !document.activeElement || document.activeElement === document.body
      if (lost && el.isConnected) el.focus({ preventScroll: true })
      if (lost || performance.now() - started > 1500) window.clearInterval(t)
    }, 50)
    return () => window.clearInterval(t)
  }, [open])
}

// Back closes the sheet: an open sheet adds one history entry (same URL), back pops it, and closing
// the sheet any other way pops it for you, so the history ends where it started.
let unwinding = false
const queued: (() => void)[] = []
let watching = false
function watchUnwind() {
  if (watching || typeof window === 'undefined') return
  watching = true
  window.addEventListener('popstate', () => {
    if (!unwinding) return
    unwinding = false
    queued.splice(0).forEach((fn) => fn())
  })
}
const whenSettled = (fn: () => void) => (unwinding ? queued.push(fn) : fn())

/**
 * Run a navigation after a sheet you just closed has removed its history entry. Use it when a button
 * inside a sheet closes it and moves to another page, so the back entry isn't popped mid-navigation.
 */
export function afterSheetClose(fn: () => void) {
  // The close commits (and its cleanup calls history.back) before this timer fires.
  window.setTimeout(() => whenSettled(fn), 0)
}

function useBackCloses(open: boolean, onOpenChange: (open: boolean) => void) {
  const change = useRef(onOpenChange)
  useEffect(() => {
    change.current = onOpenChange
  })
  useEffect(() => {
    if (!open) return
    watchUnwind()
    const id = Math.random().toString(36).slice(2)
    let pushed = false
    let popped = false
    let gone = false
    const onPop = () => {
      if (pushed && history.state?.__sheet !== id) {
        popped = true
        change.current(false)
      }
    }
    // Deferred, so a closed-then-reopened sheet waits for the previous entry to go first
    // (and dev's double effects push only once). Next's own state is kept so its router is unaffected.
    const t = window.setTimeout(() =>
      whenSettled(() => {
        if (gone) return
        history.pushState({ ...history.state, __sheet: id }, '')
        pushed = true
        window.addEventListener('popstate', onPop)
      }),
    )
    return () => {
      gone = true
      window.clearTimeout(t)
      window.removeEventListener('popstate', onPop)
      if (pushed && !popped && history.state?.__sheet === id) {
        unwinding = true
        history.back()
      }
    }
  }, [open])
}
