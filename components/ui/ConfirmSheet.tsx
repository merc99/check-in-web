'use client'

import type { ReactNode } from 'react'
import { Button } from './Button'
import { Sheet } from './Sheet'

/**
 * "Are you sure?" for destructive actions. Names the thing, says what happens,
 * red button says exactly what it does, and "Keep it" backs out.
 */
export function ConfirmSheet({
  open, onClose, title, body, confirmLabel, onConfirm, children,
}: {
  open: boolean
  onClose: () => void
  title: string
  body: ReactNode
  confirmLabel: string
  onConfirm: () => void
  /** Extra content between the copy and the buttons (e.g. a type-to-confirm field). */
  children?: ReactNode
}) {
  return (
    <Sheet open={open} onClose={onClose} label={title}>
      <div className="flex flex-col gap-4 pt-2">
        <h2 className="font-display text-[28px] leading-none">{title}</h2>
        <p className="text-ink-soft">{body}</p>
        {children}
        <Button variant="danger" block onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button block onClick={onClose}>
          Keep it
        </Button>
      </div>
    </Sheet>
  )
}
