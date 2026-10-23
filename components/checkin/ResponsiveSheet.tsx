'use client'

import type { ReactNode } from 'react'
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
