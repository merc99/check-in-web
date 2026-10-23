'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/lib/auth'
import { DATA_SOURCE, getMyGroups, useQuery, type GroupSummary } from '@/lib/data'
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
  const [stored, setStored] = useState<string | null>(null)

  useEffect(() => {
    try {
      setStored(localStorage.getItem(STORAGE_KEY))
    } catch {
      // Private mode or blocked storage: the first crew is fine.
    }
  }, [])

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

  // Fake crew activity: mock data only (dev, or NEXT_PUBLIC_SIMULATE_LIVE=true). Mostly lands in the crew on screen.
  useLiveSimulation(activeId, SIMULATE_LIVE && DATA_SOURCE === 'mock' && signedIn)

  return (
    <Ctx.Provider value={{ activeId, setActiveId, groups: list, loading: groups.loading && !list }}>{children}</Ctx.Provider>
  )
}
