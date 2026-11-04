'use client'

import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { LiveProvider } from '@/components/checkin/LivePill'
import { ToastProvider } from '@/components/checkin/Toast'
import { ActiveCrewProvider } from '@/lib/activeCrew'
import { AuthGate, AuthProvider } from '@/lib/auth'

export function Providers({ children }: { children: ReactNode }) {
  // Motion's JS animations ignore the CSS reduced-motion rule; "user" drops their movement and keeps fades.
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <LiveProvider>
          <AuthProvider>
            <ActiveCrewProvider>
              <AuthGate>{children}</AuthGate>
            </ActiveCrewProvider>
          </AuthProvider>
        </LiveProvider>
      </ToastProvider>
    </MotionConfig>
  )
}
