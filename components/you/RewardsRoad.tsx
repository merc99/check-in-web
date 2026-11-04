'use client'

import { Check, CreditCard, Circle, Type } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { RankEmblem } from '@/components/checkin/Progression'
import type { MyProgress, RewardState } from '@/lib/data'
import { useDragScroll } from '@/lib/useDragScroll'
import { xpForLevel } from '@/lib/progression'
import { cn } from '@/lib/utils'

const SLOT_ICON = { card: CreditCard, frame: Circle, title: Type } as const

/**
 * The rewards road (progression): every level that gives you something, in order, as one track.
 * Earned stops are checked off in mint, the next one says how much XP is left, later ones wait.
 * No season and no clock: it's your road, it doesn't reset.
 */
export function RewardsRoad({ progress: p }: { progress: MyProgress }) {
  const track = useRef<HTMLOListElement>(null)
  useDragScroll(track, p.level)
  const stops = new Map<number, RewardState[]>()
  for (const r of p.rewards) if (r.level !== null && r.level > 1) stops.set(r.level, [...(stops.get(r.level) ?? []), r])
  const levels = [...stops.keys()].sort((a, b) => a - b)
  const nextLevel = levels.find((l) => l > p.level)

  // Open on the stop you're heading for, without moving the page.
  useEffect(() => {
    const el = track.current
    const next = el?.querySelector<HTMLElement>('[data-next]')
    if (el && next) el.scrollLeft = Math.max(0, next.offsetLeft - el.clientWidth / 2 + next.clientWidth / 2)
  }, [nextLevel])

  return (
    <ol
      ref={track}
      aria-label="Rewards by level"
      className="no-scrollbar -mx-5 flex cursor-grab snap-x gap-2 overflow-x-auto scroll-px-5 px-5 pb-2 pt-1 select-none lg:mx-0 lg:px-0"
    >
      {levels.map((l, i) => {
        const done = p.level >= l
        const next = l === nextLevel
        const toGo = xpForLevel(l) - p.xp
        return (
          <li
            key={l}
            data-next={next ? '' : undefined}
            className={cn(
              'relative flex w-[148px] flex-none snap-start flex-col rounded-lg border bg-card p-3 edge-lit',
              next ? 'border-border-strong' : !done && 'opacity-80',
            )}
          >
            {/* The road: a line through every stop, mint where you've been. */}
            {i < levels.length - 1 && (
              <span aria-hidden="true" className={cn('absolute -right-2 top-[26px] h-0.5 w-2', p.level >= levels[i + 1] ? 'bg-primary' : 'bg-border-strong')} />
            )}
            <div className="flex items-center gap-2">
              <RankEmblem level={l} size="sm" className={cn(!done && !next && 'opacity-60 grayscale')} />
              <span className="text-[13px] font-medium">Level {l}</span>
            </div>
            <ul className="mt-3 flex flex-1 flex-col gap-1.5">
              {stops.get(l)!.map((r) => {
                const Icon = SLOT_ICON[r.slot]
                return (
                  <li key={r.id} className="flex items-center gap-1.5 text-[12px] leading-tight">
                    <Icon size={13} aria-hidden="true" className="flex-none text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{r.name}</span>
                      <span className="block truncate text-muted-foreground">{r.slot === 'title' ? 'Title' : r.slot === 'card' ? 'Card finish' : 'Frame'}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-[12px]">
              {done ? (
                <span className="inline-flex items-center gap-1 text-primary-ink">
                  <Check size={13} strokeWidth={2.5} aria-hidden="true" /> Earned
                </span>
              ) : next ? (
                <span className="tnum font-medium">{toGo.toLocaleString()} XP to go</span>
              ) : (
                <span className="tnum text-muted-foreground">{xpForLevel(l).toLocaleString()} XP</span>
              )}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
