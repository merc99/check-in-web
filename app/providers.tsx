'use client'

import type { ReactNode } from 'react'
import { LiveProvider } from '@/components/checkin/LivePill'
import { ToastProvider } from '@/components/checkin/Toast'
import { ActiveCrewProvider } from '@/lib/activeCrew'
import { AuthGate, AuthProvider } from '@/lib/auth'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <LiveProvider>
        <AuthProvider>
          <ActiveCrewProvider>
            <AuthGate>{children}</AuthGate>
          </ActiveCrewProvider>
        </AuthProvider>
      </LiveProvider>
    </ToastProvider>
  )
}
