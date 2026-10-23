'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DATA_SOURCE } from '@/lib/data/api'
import { supabase } from '@/lib/supabase/client'

type Status = 'loading' | 'signedOut' | 'signedIn'

interface Auth {
  status: Status
  userId: string | null
  /** Signed in, but no name yet: profile setup comes first. */
  needsSetup: boolean
  /** Emails a 6-digit code. Creates the account on first use. */
  sendCode: (email: string) => Promise<void>
  /** Resolves with whether the person still needs to set up their profile. */
  verifyCode: (email: string, code: string) => Promise<{ needsSetup: boolean }>
  /** Mock mode only: "Get started" signs straight in, like the prototype. */
  enterDemo: () => void
  signOut: () => Promise<void>
  /** Re-read the profile (after profile setup saves). */
  refresh: () => Promise<void>
}

const Ctx = createContext<Auth | null>(null)

export function useAuth(): Auth {
  const auth = useContext(Ctx)
  if (!auth) throw new Error('useAuth needs <AuthProvider>')
  return auth
}

const PENDING_INVITE = 'checkin.pendingInvite'

/** Remember an invite while someone signs in, so they land back on it. */
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

function friendlyAuthError(message: string, fallback: string) {
  if (/rate|too many|seconds/i.test(message)) return 'Too many codes in a row. Wait a minute and try again.'
  if (/expired|invalid|token/i.test(message)) return 'That code didn’t work. Check it, or send a new one.'
  return fallback
}

async function profileNeedsSetup(userId: string): Promise<boolean> {
  const { data } = await supabase().from('profiles').select('name').eq('id', userId).maybeSingle()
  return !data?.name?.trim()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const mock = DATA_SOURCE === 'mock'
  const [status, setStatus] = useState<Status>('loading')
  const [userId, setUserId] = useState<string | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)

  const adopt = useCallback(async (id: string | null) => {
    setUserId(id)
    if (!id) {
      setNeedsSetup(false)
      setStatus('signedOut')
      return
    }
    setNeedsSetup(await profileNeedsSetup(id))
    setStatus('signedIn')
  }, [])

  useEffect(() => {
    if (mock) {
      // Demo: a visit to `/` starts at the intro; deep links (/feed, /invite/…) go straight in.
      const atIntro = window.location.pathname === '/'
      setUserId(atIntro ? null : 'me')
      setStatus(atIntro ? 'signedOut' : 'signedIn')
      return
    }
    const client = supabase()
    client.auth.getSession().then(({ data }) => adopt(data.session?.user.id ?? null))
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      // Defer: supabase-js warns against awaiting other calls inside this callback.
      setTimeout(() => adopt(session?.user.id ?? null), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [mock, adopt])

  const value = useMemo<Auth>(
    () => ({
      status,
      userId,
      needsSetup,
      sendCode: async (email) => {
        if (mock) return
        const { error } = await supabase().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } })
        if (error) throw new Error(friendlyAuthError(error.message, 'That didn’t send. Check the email and try again.'))
      },
      verifyCode: async (email, code) => {
        if (mock) return { needsSetup: false }
        const { data, error } = await supabase().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
        if (error || !data.user) throw new Error(friendlyAuthError(error?.message ?? '', 'That code didn’t work. Check it, or send a new one.'))
        const setup = await profileNeedsSetup(data.user.id)
        setNeedsSetup(setup)
        setUserId(data.user.id)
        setStatus('signedIn')
        return { needsSetup: setup }
      },
      enterDemo: () => {
        setUserId('me')
        setStatus('signedIn')
      },
      signOut: async () => {
        if (!mock) await supabase().auth.signOut()
        setUserId(null)
        setNeedsSetup(false)
        setStatus('signedOut')
      },
      refresh: async () => {
        if (!mock && userId) setNeedsSetup(await profileNeedsSetup(userId))
      },
    }),
    [status, userId, needsSetup, mock],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

const isPublic = (path: string) => path === '/' || path.startsWith('/invite/')

/**
 * Sends people where they belong: signed out → the intro; signed in without a
 * name → profile setup; signed in on the intro → their pending invite or the feed.
 * Renders nothing until it knows, so private screens never flash.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, needsSetup } = useAuth()
  const path = usePathname()
  const router = useRouter()

  let target: string | null = null
  if (status === 'signedOut' && !isPublic(path)) target = '/'
  else if (status === 'signedIn' && needsSetup && path !== '/profile-setup' && !path.startsWith('/invite/')) target = '/profile-setup'
  else if (status === 'signedIn' && !needsSetup && (path === '/' || path === '/profile-setup')) target = 'home'

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
