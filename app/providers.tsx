'use client'

import type { ReactNode } from 'react'
import { LiveProvider } from '@/components/ui/LivePill'
import { ToastProvider } from '@/components/ui/Toast'
import { ActiveCrewProvider } from '@/lib/activeCrew'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <LiveProvider>
        <ActiveCrewProvider>{children}</ActiveCrewProvider>
      </LiveProvider>
    </ToastProvider>
  )
}
