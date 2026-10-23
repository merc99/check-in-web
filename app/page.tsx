'use client'

import { BrandMark } from '@/components/checkin/BrandMark'
import { Button } from '@/components/checkin/Button'
import { useAuth } from '@/lib/auth'

/**
 * `/`: signed in, the gate sends you to the feed. Signed out (after Sign out), the welcome
 * screen: the logo lockup and one way back in. There's no intro tour.
 */
export default function WelcomePage() {
  const auth = useAuth()
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="flex w-full max-w-[360px] flex-col items-center text-center">
        <BrandMark size="lg" />
        <p className="mt-8 font-display text-[28px] leading-[1.05] tracking-tighter">No shame days, just show up.</p>
        <Button variant="primary" block className="mt-8" onClick={auth.enterDemo}>
          Sign back in
        </Button>
      </div>
    </main>
  )
}
