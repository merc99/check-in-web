'use client'

import { useState } from 'react'
import { IntroSlides } from '@/components/intro/IntroSlides'
import { SignInForm } from '@/components/intro/SignInForm'
import { useAuth } from '@/lib/auth'
import { DATA_SOURCE } from '@/lib/data'

/** `/`: the intro, then email sign-in. Signed-in visitors never see it (the auth gate moves them on). */
export default function IntroPage() {
  const auth = useAuth()
  const [signingIn, setSigningIn] = useState(false)

  return (
    <main className="px-5">
      {signingIn ? (
        <SignInForm onBack={() => setSigningIn(false)} />
      ) : (
        // The demo skips sign-in, like the prototype.
        <IntroSlides onStart={() => (DATA_SOURCE === 'mock' ? auth.enterDemo() : setSigningIn(true))} />
      )}
    </main>
  )
}
