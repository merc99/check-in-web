'use client'

import type { Person } from '@/lib/data'
import { cn } from '@/lib/utils'
import { Avatar } from './Avatar'
import { CheckIcon } from './icons'

export interface MemberStickerProps {
  person: Person
  inToday: boolean
  isMe: boolean
  /** They just checked in: the sticker pops and the check spins on. */
  arrived?: boolean
  /** You waved at them today: a 👋 sits on their sticker. */
  waved?: boolean
  size?: 'sm' | 'md'
  /** Opens their profile. */
  onTap?: (id: string) => void
  /** Sends a wave (offered on a crewmate who isn't in yet and hasn't been waved at today). */
  onWave?: (id: string) => void
  className?: string
}

/**
 * A crewmate in "who's in today" (CrewHero, TodayStrip). In: their color with a mint check.
 * Not in yet: faded and dashed, and a tap waves at them (once a day) instead of opening the profile.
 */
export function MemberSticker({ person, inToday, isMe, arrived, waved, size = 'md', onTap, onWave, className }: MemberStickerProps) {
  const canWave = !isMe && !inToday && !waved && !!onWave
  const sm = size === 'sm'
  const avatar = (
    <Avatar name={person.name} color={person.color} photoUrl={person.photoUrl} size={sm ? 'sm' : 'md'} pending={!inToday} className={cn(!inToday && sm && 'opacity-80')} />
  )
  const action = canWave ? () => onWave(person.id) : !isMe && onTap ? () => onTap(person.id) : undefined
  const label = canWave ? `Wave at ${person.name}` : `View ${person.name}`

  return (
    <li data-person={person.id} className={cn('relative inline-block', waved && !inToday && 'z-10', arrived && 'animate-stickpop', className)}>
      {action ? (
        <button
          type="button"
          onClick={action}
          aria-label={label}
          className="hit-44 block rounded-full transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[.94]"
        >
          {avatar}
        </button>
      ) : (
        avatar
      )}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute grid place-items-center rounded-full bg-on-color text-primary transition-transform duration-350 ease-spring',
          sm ? '-bottom-[3px] -right-[3px] size-[15px]' : '-bottom-1 -right-1 size-5 border border-on-color/20',
          inToday ? 'scale-100' : 'scale-0',
          arrived && 'animate-tickpop',
        )}
      >
        <CheckIcon size={sm ? 9 : 11} />
      </span>
      {/* The wave you sent sits on their sticker until they show up. */}
      {waved && !inToday && (
        <span
          aria-hidden="true"
          className={cn('pointer-events-none absolute origin-bottom-left animate-handwave leading-none', sm ? '-right-1 -top-2 text-[14px]' : '-right-1 -top-2 text-[16px]')}
        >
          👋
        </span>
      )}
      <span className="sr-only">{`${isMe ? 'You' : person.name}: ${inToday ? 'in today' : waved ? 'not yet, you waved' : 'not yet'}`}</span>
    </li>
  )
}
