'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useAuth } from '@/lib/auth'
import { getMyGroups, useQuery, type GroupSummary } from '@/lib/data'
import { SIMULATE_LIVE, useLiveSimulation } from '@/lib/mock/simulation'

const STORAGE_KEY = 'checkin.activeCrew'

interface ActiveCrew {
  /** The crew on screen. Null when you're in no crews (or before they load). */
  activeId: string | null
  setActiveId: (id: string) => void
  groups: GroupSummary[] | undefined
  loading: boolean
}

const Ctx = createContext<ActiveCrew>({ activeId: null, setActiveId: () => {}, groups: undefined, loading: true })

export const useActiveCrew = () => useContext(Ctx)

/** Which crew the feed shows. Remembered per browser; falls back to your first crew. */
export function ActiveCrewProvider({ children }: { children: ReactNode }) {
  const { status, userId } = useAuth()
  const signedIn = status === 'signedIn' && !!userId
  const groups = useQuery(() => (signedIn ? getMyGroups() : Promise.resolve([])), [signedIn, userId], ['groups', 'group_members', 'check_ins'])
  // Read once on the client. Nothing renders from it until the crews load, so the server's null is fine.
  const [stored, setStored] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null // Private mode or blocked storage: the first crew is fine.
    }
  })

  const setActiveId = useCallback((id: string) => {
    setStored(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // Not remembered across reloads; still works for this visit.
    }
  }, [])

  const list = groups.data
  const activeId = list ? (list.find((g) => g.id === stored)?.id ?? list[0]?.id ?? null) : null

  // Fake crew activity while you're in the app. Mostly lands in the crew on screen.
  useLiveSimulation(activeId, SIMULATE_LIVE && signedIn)

  return (
    <Ctx.Provider value={{ activeId, setActiveId, groups: list, loading: groups.loading && !list }}>{children}</Ctx.Provider>
  )
}
