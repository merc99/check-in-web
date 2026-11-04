'use client'

import type { ReactNode } from 'react'
import { Sparkline } from '@/components/fx/Gloss'
import { RollingCount } from '@/components/fx/RollingCount'
import { addDays } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Hue } from '@/lib/colors'
import type { Person } from '@/lib/data'
import { MemberSticker } from './MemberSticker'

export interface HeroMember {
  person: Person
  inToday: boolean
  isMe: boolean
}

export interface CrewHeroProps {
  color: Hue
  members: HeroMember[]
  /** The person who just arrived: their sticker pops and their check badge spins in. */
  arrivedId?: string | null
  onPersonTap?: (id: string) => void
  /** Wave at a crewmate who isn't in yet. */
  onWave?: (id: string) => void
  /** Whether you've waved at this crewmate today. */
  waved?: (id: string) => boolean
  /** Consecutive days with at least one member in (shown as a pill when > 1). */
  streak?: number
  /** Members in on each of the last 14 days, oldest first (shown as a sparkline). */
  recent?: number[]
  /** Join requests (owners): a row at the bottom of the card. */
  requests?: ReactNode
}

export function heroLine(n: number, total: number, meIn: boolean) {
  if (total > 1 && n === total) return 'Whole crew showed up today. That’s the whole point.'
  if (meIn) return 'You’re in. The rest will get there.'
  return 'Whenever you’re ready. No rush.'
}

/**
 * Who's in today, for the desktop rail: a plain card (references: Chord "Team usage", Data API).
 * "n/total in today" with a small muted unit, the brand line, the last two weeks as a thin line,
 * a sticker per member and the tally (one pill per member, mint when they're in).
 */
export function CrewHero({ color, members, arrivedId, onPersonTap, onWave, waved, streak, recent, requests }: CrewHeroProps) {
  const n = members.filter((m) => m.inToday).length
  const total = members.length
  const everyone = total > 1 && n === total

  return (
    <section role="region" aria-label="Who’s in today" data-hue={color} className="rounded-xl border bg-card p-5 edge-lit">
      <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
        <span>In today</span>
        {!!streak && streak > 1 && (
          <span className="font-mono text-[12px]">
            <span className="tnum text-foreground">{streak}</span>-day streak
          </span>
        )}
      </div>

      <p className="mt-3 flex items-baseline gap-1">
        <span className="tnum text-[56px] font-medium leading-none tracking-tightest">
          <RollingCount n={n} tight label={`${n} of ${total} in today`} />
        </span>
        <span aria-hidden="true" className="tnum text-[20px] text-muted-foreground">/{total}</span>
        {everyone && <span className="ml-2 text-[13px] font-medium text-primary-ink">all in</span>}
      </p>
      <p className="mt-2 text-[13px] text-muted-foreground">{heroLine(n, total, members.some((m) => m.isMe && m.inToday))}</p>

      {recent && recent.length > 1 && (
        <div className="mt-4">
          <Sparkline
            values={recent}
            height={44}
            className="text-primary"
            label="Members in each day, last 14 days"
            pointLabel={(i) => {
              const day = addDays(new Date(), i - (recent.length - 1))
              const when = i === recent.length - 1 ? 'Today' : day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
              return `${when} · ${recent[i]} in`
            }}
          />
          <div aria-hidden="true" className="mt-1 flex justify-between font-mono text-[12px] text-subtle-foreground">
            <span>14 days ago</span>
            <span>today</span>
          </div>
        </div>
      )}

      <ul className="mt-4 flex flex-wrap gap-2">
        {members.map(({ person, inToday, isMe }) => (
          <MemberSticker
            key={person.id}
            person={person}
            inToday={inToday}
            isMe={isMe}
            arrived={arrivedId === person.id}
            waved={waved?.(person.id)}
            onTap={onPersonTap}
            onWave={onWave}
          />
        ))}
      </ul>

      <div aria-hidden="true" className="mt-4 flex gap-1">
        {members.map((m, i) => (
          <span key={m.person.id} className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <span className={cn('absolute inset-0 origin-left bg-primary shadow-[inset_0_0_0_1px_var(--primary-ink)] transition-transform duration-200 ease-out dark:shadow-none', i < n ? 'scale-x-100' : 'scale-x-0')} />
          </span>
        ))}
      </div>
      {requests && <div className="mt-4 empty:hidden">{requests}</div>}
    </section>
  )
}
