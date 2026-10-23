'use client'

import { AuroraFrame } from '@/components/fx/loops'
import { RollingCount } from '@/components/fx/RollingCount'
import { cn } from '@/lib/utils'
import { HUE_CLASS, type Hue } from '@/lib/colors'
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
}

function heroLine(n: number, total: number, meIn: boolean) {
  if (n === total) return 'Whole crew showed up today. That’s the whole point.'
  if (meIn) return 'You’re in. The rest will get there.'
  return 'Whenever you’re ready. No rush.'
}

/** The signature card: "n/total in today", a sticker per member, and a segmented bar. */
export function CrewHero({ color, members, arrivedId, onPersonTap }: CrewHeroProps) {
  const n = members.filter((m) => m.inToday).length
  const total = members.length
  const everyone = total > 1 && n === total

  return (
    // The aurora frame is the crew-complete moment: it turns only while everyone's in today.
    <AuroraFrame on={everyone} className="rounded-lg">
    <section
      aria-label="Who’s in today"
      className={cn('relative overflow-hidden rounded-lg border border-border p-5 shadow-raised transition-colors duration-200', HUE_CLASS[color].soft)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="tnum font-display text-[72px] leading-[.85] max-[380px]:text-[60px]">
            <RollingCount n={n} tight label={`${n} of ${total}`} />
            <span aria-hidden="true" className="text-[32px] opacity-55">/{total}</span>
          </div>
          <p className="mt-2 font-bold">in today</p>
        </div>
        <p className="max-w-[17ch] pt-[6px] text-right text-sm font-medium">
          {heroLine(n, total, members.some((m) => m.isMe && m.inToday))}
        </p>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2">
        {members.map(({ person, inToday, isMe }) => {
          const arrived = arrivedId === person.id
          const avatar = <Avatar name={person.name} color={person.color} photoUrl={person.photoUrl} pending={!inToday} />
          return (
            <li key={person.id} className={cn('relative inline-block transition-transform duration-300 ease-spring', arrived && 'animate-stickpop')}>
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
                  'absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border border-border bg-primary text-primary-foreground transition-transform duration-350 ease-spring',
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
          <span key={m.person.id} className="relative h-[10px] flex-1 overflow-hidden rounded-full border border-border bg-card">
            <span
              className={cn(
                'absolute inset-0 origin-left bg-foreground transition-transform duration-200 ease-out',
                i < n ? 'scale-x-100' : 'scale-x-0',
              )}
            />
          </span>
        ))}
      </div>
    </section>
    </AuroraFrame>
  )
}
