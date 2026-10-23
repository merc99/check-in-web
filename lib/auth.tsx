'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

// Demo sign-in. There are no accounts: the app opens signed in as Ben (no intro). Sign out
// shows the welcome screen at `/`, where "Sign back in" returns. Real email sign-in lives on
// the `supabase` branch.

type Status = 'loading' | 'signedOut' | 'signedIn'

interface Auth {
  status: Status
  userId: string | null
  /** "Sign back in" on the welcome screen, or "Get started" on an invite. */
  enterDemo: () => void
  signOut: () => Promise<void>
}

const Ctx = createContext<Auth | null>(null)

export function useAuth(): Auth {
  const auth = useContext(Ctx)
  if (!auth) throw new Error('useAuth needs <AuthProvider>')
  return auth
}

const PENDING_INVITE = 'checkin.pendingInvite'

/** Remember an invite while someone is signed out, so they land back on it. */
export function setPendingInvite(slug: string | null) {
  try {
    if (slug) localStorage.setItem(PENDING_INVITE, slug)
    else localStorage.removeItem(PENDING_INVITE)
  } catch {
    // Storage blocked: they'll just land on the feed instead.
  }
}
function pendingInvite(): string | null {
  try {
    return localStorage.getItem(PENDING_INVITE)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Every visit starts signed in, straight into the app; only Sign out leaves.
  const [status, setStatus] = useState<Status>('signedIn')

  const value = useMemo<Auth>(
    () => ({
      status,
      userId: status === 'signedIn' ? 'me' : null,
      enterDemo: () => setStatus('signedIn'),
      signOut: async () => setStatus('signedOut'),
    }),
    [status],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

const isPublic = (path: string) => path === '/' || path.startsWith('/invite/')

/**
 * Signed out → the welcome screen. Signed in on `/` → a pending invite or the feed.
 * Renders nothing until it knows, so screens never flash.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const path = usePathname()
  const router = useRouter()

  let target: string | null = null
  if (status === 'signedOut' && !isPublic(path)) target = '/'
  else if (status === 'signedIn' && path === '/') target = 'home'

  useEffect(() => {
    if (!target) return
    if (target === 'home') {
      const slug = pendingInvite()
      router.replace(slug ? `/invite/${slug}` : '/feed')
    } else {
      router.replace(target)
    }
  }, [target, router])

  if (status === 'loading' || target) return <main className="min-h-dvh" />
  return <>{children}</>
}
