'use client'

import type { ReactNode } from 'react'
import { LiveProvider } from '@/components/ui/LivePill'
import { ToastProvider } from '@/components/ui/Toast'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <LiveProvider>{children}</LiveProvider>
    </ToastProvider>
  )
}
