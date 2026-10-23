'use client'

import { Flame } from 'lucide-react'
import { Gloss, GlassInset, GlossPill, Sparkline } from '@/components/fx/Gloss'
import { AuroraFrame } from '@/components/fx/loops'
import { RollingCount } from '@/components/fx/RollingCount'
import { addDays } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Hue } from '@/lib/colors'
import type { Person } from '@/lib/data'
import { Avatar } from './Avatar'
import { CheckIcon } from './icons'

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
  /** Consecutive days with at least one member in (shown as a pill when > 1). */
  streak?: number
  /** Members in on each of the last 14 days, oldest first (shown as a sparkline). */
  recent?: number[]
}

function heroLine(n: number, total: number, meIn: boolean) {
  if (n === total) return 'Whole crew showed up today. That’s the whole point.'
  if (meIn) return 'You’re in. The rest will get there.'
  return 'Whenever you’re ready. No rush.'
}

/**
 * The signature card, as a glossy panel in the crew's hue (fx/Gloss): "n/total in today", the crew
 * streak, the last two weeks as a sparkline, a sticker per member and a segmented bar. The aurora
 * frame turns on only while the whole crew is in (fx/AuroraFrame).
 */
export function CrewHero({ color, members, arrivedId, onPersonTap, streak, recent }: CrewHeroProps) {
  const n = members.filter((m) => m.inToday).length
  const total = members.length
  const everyone = total > 1 && n === total

  return (
    <AuroraFrame on={everyone} className="rounded-xl">
      <Gloss hue={color} role="region" aria-label="Who’s in today" className="rounded-xl p-5">
        <div className="flex items-center justify-between gap-3">
          <GlossPill>In today</GlossPill>
          {!!streak && streak > 1 && (
            <GlossPill solid>
              <Flame size={13} strokeWidth={2.25} aria-hidden="true" />
              <span>
                <span className="tnum">{streak}</span>-day crew streak
              </span>
            </GlossPill>
          )}
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="tnum font-display text-[72px] leading-[.85] tracking-tightest max-[380px]:text-[60px]">
            <RollingCount n={n} tight label={`${n} of ${total} in today`} />
            <span aria-hidden="true" className="text-[32px] opacity-60">/{total}</span>
          </div>
          <p className="max-w-[17ch] pt-[6px] text-right text-sm font-semibold">{heroLine(n, total, members.some((m) => m.isMe && m.inToday))}</p>
        </div>

        {recent && recent.length > 1 && (
          <GlassInset className="mt-4 px-3 pb-2 pt-[10px]">
            <div className="flex items-baseline justify-between text-[12px] font-bold">
              <span>Last 14 days</span>
              <span className="opacity-70">today</span>
            </div>
            <Sparkline
              values={recent}
              height={44}
              className="mt-1"
              label="Members in each day, last 14 days"
              pointLabel={(i) => {
                const day = addDays(new Date(), i - (recent.length - 1))
                const when = i === recent.length - 1 ? 'Today' : day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
                return `${when} · ${recent[i]} in`
              }}
            />
          </GlassInset>
        )}

        <ul className="mt-4 flex flex-wrap gap-2">
          {members.map(({ person, inToday, isMe }) => {
            const arrived = arrivedId === person.id
            const avatar = <Avatar name={person.name} color={person.color} photoUrl={person.photoUrl} pending={!inToday} />
            return (
              <li key={person.id} data-person={person.id} className={cn('relative inline-block transition-transform duration-300 ease-spring', arrived && 'animate-stickpop')}>
                {onPersonTap && !isMe ? (
                  <button
                    type="button"
                    onClick={() => onPersonTap(person.id)}
                    aria-label={`View ${person.name}`}
                    className="block rounded-full transition-transform duration-150 ease-out hover:scale-[1.06]"
                  >
                    {avatar}
                  </button>
                ) : (
                  avatar
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border border-on-color/20 bg-on-color text-primary transition-transform duration-350 ease-spring',
                    inToday ? 'scale-100' : 'scale-0',
                    arrived && 'animate-tickpop',
                  )}
                >
                  <CheckIcon size={11} />
                </span>
                <span className="sr-only">{`${isMe ? 'You' : person.name}: ${inToday ? 'in today' : 'not yet'}`}</span>
              </li>
            )
          })}
        </ul>

        <div aria-hidden="true" className="mt-5 flex gap-[6px]">
          {members.map((m, i) => (
            <span key={m.person.id} className="relative h-[10px] flex-1 overflow-hidden rounded-full bg-white/35 shadow-[inset_0_0_0_1px_rgb(255_255_255/.4)]">
              <span
                className={cn('absolute inset-0 origin-left bg-on-color transition-transform duration-200 ease-out', i < n ? 'scale-x-100' : 'scale-x-0')}
              />
            </span>
          ))}
        </div>
      </Gloss>
    </AuroraFrame>
  )
}
