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
  /** Resting heights for the phone sheet, as fractions of the viewport (Arc `detents`). */
  detents?: number[]
  children: ReactNode
}

/**
 * Arc's bottom sheet on phones, a centered dialog on desktop (lg and up). Same title, content and
 * open state either way; both close on Escape, trap focus and return it to the trigger.
 */
export function ResponsiveSheet({ open, onOpenChange, title, description, detents, children }: ResponsiveSheetProps) {
  const desktop = useDesktop()
  useReturnFocus(open)

  if (!desktop) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange} title={title} description={description} detents={detents}>
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
        <DialogTitle className="mb-5 pr-10 font-display text-[28px] font-bold leading-none tracking-tighter">{title}</DialogTitle>
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
