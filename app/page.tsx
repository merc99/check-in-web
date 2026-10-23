'use client'

import { IntroSlides } from '@/components/intro/IntroSlides'
import { useAuth } from '@/lib/auth'

/** `/`: the intro. "Get started" goes straight into the demo, like the prototype. */
export default function IntroPage() {
  const auth = useAuth()
  return (
    <main className="px-5">
      <IntroSlides onStart={auth.enterDemo} />
    </main>
  )
}
