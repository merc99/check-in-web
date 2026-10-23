'use client'

import { useEffect, useRef } from 'react'
import type { CheckIn } from '@/lib/data/types'
import { localDate } from '@/lib/dates'
import { insertCheckIn, setHeart } from './api'
import { db, onChange } from './db'
import { ME_ID, NOTES } from './seed'

// Fakes crew activity so the prototype feels alive: every 9–16s a crew member who
// hasn't checked in today does, and someone hearts your check-in shortly after you post.
// It only writes rows; screens react through the same realtime events Supabase will send.

/** On by default (the demo should feel alive). Set NEXT_PUBLIC_SIMULATE_LIVE=false to turn it off. */
export const SIMULATE_LIVE = process.env.NEXT_PUBLIC_SIMULATE_LIVE !== 'false'

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)]
const today = () => localDate(new Date())

/**
 * One crew member checks in. Prefers `activeGroupId` (75% of the time), otherwise any crew
 * you're in. Returns false when everyone is already in.
 */
export function simulateArrival(activeGroupId?: string | null): boolean {
  const t = db()
  const myGroups = t.group_members.filter((m) => m.user_id === ME_ID && !m.deleted_at).map((m) => m.group_id)
  const live = myGroups.filter((id) => t.groups.some((g) => g.id === id && !g.deleted_at))
  if (!live.length) return false
  const groupId = activeGroupId && live.includes(activeGroupId) && Math.random() < 0.75 ? activeGroupId : pick(live)
  const waiting = t.group_members
    .filter((m) => m.group_id === groupId && !m.deleted_at && m.user_id !== ME_ID)
    .map((m) => m.user_id)
    .filter((uid) => !t.check_ins.some((c) => c.user_id === uid && c.group_id === groupId && !c.deleted_at && c.local_date === today()))
  if (!waiting.length) return false
  const [note, tags] = pick(NOTES[groupId] ?? NOTES._)
  const crewTags = new Set(t.tags.filter((x) => x.group_id === groupId && !x.deleted_at).map((x) => x.name))
  insertCheckIn(pick(waiting), { groupId, note, tags: tags.filter((name) => crewTags.has(name)) })
  return true
}

/** Someone else in the crew hearts this check-in. */
export function simulateHeart(checkInId: string): boolean {
  const t = db()
  const c = t.check_ins.find((x) => x.id === checkInId)
  if (!c) return false
  const fans = t.group_members
    .filter((m) => m.group_id === c.group_id && !m.deleted_at && m.user_id !== c.user_id)
    .map((m) => m.user_id)
    .filter((uid) => !t.reactions.some((r) => r.check_in_id === checkInId && r.user_id === uid && !r.deleted_at))
  if (!fans.length) return false
  setHeart(pick(fans), checkInId, true)
  return true
}

/** Mount once near the top of the app. Pass the crew on screen so most arrivals land there. */
export function useLiveSimulation(activeGroupId: string | null = null, enabled = SIMULATE_LIVE) {
  const active = useRef(activeGroupId)
  active.current = activeGroupId

  useEffect(() => {
    if (!enabled) return
    let timer: ReturnType<typeof setTimeout>
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const schedule = () => {
      timer = setTimeout(() => {
        if (!document.hidden) simulateArrival(active.current)
        schedule()
      }, 9000 + Math.random() * 7000)
    }
    schedule()

    const stop = onChange((change) => {
      if (change.table !== 'check_ins' || change.type !== 'INSERT') return
      const row = change.row as CheckIn
      if (row.user_id !== ME_ID) return
      const t = setTimeout(() => {
        timers.delete(t)
        simulateHeart(row.id)
      }, 2600)
      timers.add(t)
    })

    return () => {
      clearTimeout(timer)
      timers.forEach(clearTimeout)
      stop()
    }
  }, [enabled])
}
