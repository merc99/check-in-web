'use client'

import { useEffect, useRef } from 'react'
import type { CheckIn } from '@/lib/data/types'
import { localDate } from '@/lib/dates'
import { HEART } from '@/lib/reactions'
import { TIERS, tierOf, type TierKey } from '@/lib/mastery'
import { insertCheckIn, onCheckIn, onWave, setCheer, setReaction, setVouch } from './api'
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

/** A specific crewmate checks in (answering a wave). False if they're already in. */
export function simulateArrivalOf(userId: string, groupId: string): boolean {
  const t = db()
  const inAlready = t.check_ins.some((c) => c.user_id === userId && c.group_id === groupId && !c.deleted_at && c.local_date === today())
  if (inAlready) return false
  const [note, tags] = pick(NOTES[groupId] ?? NOTES._)
  const crewTags = new Set(t.tags.filter((x) => x.group_id === groupId && !x.deleted_at).map((x) => x.name))
  insertCheckIn(userId, { groupId, note, tags: tags.filter((name) => crewTags.has(name)) })
  return true
}

/** Someone else in the crew reacts to this check-in: usually a heart, sometimes another of the set. */
export function simulateHeart(checkInId: string): boolean {
  const t = db()
  const c = t.check_ins.find((x) => x.id === checkInId)
  if (!c) return false
  const fans = t.group_members
    .filter((m) => m.group_id === c.group_id && !m.deleted_at && m.user_id !== c.user_id)
    .map((m) => m.user_id)
    .filter((uid) => !t.reactions.some((r) => r.check_in_id === checkInId && r.user_id === uid && !r.deleted_at))
  if (!fans.length) return false
  const emoji = Math.random() < 0.6 ? HEART : pick(['💪', '🔥', '👏', '🙌'])
  setReaction(pick(fans), checkInId, emoji, true)
  return true
}

/** Crewmates cheer a milestone post (1 to 3 of them). */
function simulateCheers(checkInId: string, groupId: string, authorId: string, schedule: (fn: () => void, ms: number) => void) {
  const crew = db().group_members.filter((m) => m.group_id === groupId && !m.deleted_at && m.user_id !== authorId).map((m) => m.user_id)
  const fans = [...crew].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * Math.min(3, crew.length)))
  fans.forEach((uid, i) => schedule(() => setCheer(uid, checkInId, true), 2200 + i * 1800 + Math.random() * 1500))
}

/** Two crewmates vouch for a fresh Committed-and-up tier, a little after the cheers. */
function simulateVouches(userId: string, groupId: string, tier: TierKey, schedule: (fn: () => void, ms: number) => void) {
  if (tierOf(tier).at < tierOf('committed').at) return
  const crew = db().group_members.filter((m) => m.group_id === groupId && !m.deleted_at && m.user_id !== userId).map((m) => m.user_id)
  ;[...crew].sort(() => Math.random() - 0.5).slice(0, 2).forEach((uid, i) => schedule(() => setVouch(uid, userId, groupId, tier, true), 8000 + i * 4000 + Math.random() * 3000))
}

/** Now and then a crewmate vouches for one of your tiers that isn't verified yet. */
function simulateVouchForMe(): boolean {
  const t = db()
  for (const m of t.group_members.filter((x) => x.user_id === ME_ID && !x.deleted_at)) {
    const n = t.check_ins.filter((c) => c.user_id === ME_ID && c.group_id === m.group_id && !c.deleted_at).length
    for (const tier of TIERS.filter((x) => x.at >= 50 && n >= x.at)) {
      const have = t.vouches.filter((v) => v.user_id === ME_ID && v.group_id === m.group_id && v.tier === tier.key && !v.deleted_at)
      if (have.length >= 2) continue
      const voucher = t.group_members.find((x) => x.group_id === m.group_id && !x.deleted_at && x.user_id !== ME_ID && !have.some((v) => v.voucher_id === x.user_id))
      if (!voucher) continue
      setVouch(voucher.user_id, ME_ID, m.group_id, tier.key, true)
      return true
    }
  }
  return false
}

/** Mount once near the top of the app. Pass the crew on screen so most arrivals land there. */
export function useLiveSimulation(activeGroupId: string | null = null, enabled = SIMULATE_LIVE) {
  const active = useRef(activeGroupId)
  useEffect(() => {
    active.current = activeGroupId
  }, [activeGroupId])

  useEffect(() => {
    if (!enabled) return
    let timer: ReturnType<typeof setTimeout>
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const schedule = () => {
      timer = setTimeout(() => {
        if (!document.hidden) {
          simulateArrival(active.current)
          if (Math.random() < 0.3) simulateVouchForMe()
        }
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

    // About two waves in three get answered a few seconds later (they saw it and showed up).
    const stopWaves = onWave(({ groupId, userId }) => {
      if (Math.random() > 0.65) return
      const t = setTimeout(() => {
        timers.delete(t)
        simulateArrivalOf(userId, groupId)
      }, 3500 + Math.random() * 3500)
      timers.add(t)
    })

    // Milestone posts (anyone's) get cheers, and the big tiers get vouches.
    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        timers.delete(t)
        try {
          fn()
        } catch {
          // The crew changed meanwhile (someone left): skip it.
        }
      }, ms)
      timers.add(t)
    }
    const stopMilestones = onCheckIn(null, (item) => {
      if (!item.milestone) return
      simulateCheers(item.id, item.groupId, item.user.id, later)
      simulateVouches(item.user.id, item.groupId, item.milestone.tier, later)
    })

    return () => {
      clearTimeout(timer)
      timers.forEach(clearTimeout)
      stop()
      stopWaves()
      stopMilestones()
    }
  }, [enabled])
}
