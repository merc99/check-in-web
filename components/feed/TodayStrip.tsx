'use client'

import { useId, useState } from 'react'
import { Avatar } from '@/components/checkin/Avatar'
import { CheckIcon, ChevronIcon } from '@/components/checkin/icons'
import { heroLine, type HeroMember } from '@/components/checkin/CrewHero'
import { Sparkline } from '@/components/fx/Gloss'
import { RollingCount } from '@/components/fx/RollingCount'
import { addDays } from '@/lib/dates'
import { cn } from '@/lib/utils'

/** How many stickers fit before the rest fold into "+n". */
const SHOWN = 6

/**
 * Who's in today, folded into the feed banner on phones (the full CrewHero lives in the desktop rail).
 * Closed: a sticker per member and "n/total". Open: the brand line, the last 14 days and the bar.
 */
export function TodayStrip({
  members, arrivedId, onPersonTap, recent,
}: { members: HeroMember[]; arrivedId?: string | null; onPersonTap?: (id: string) => void; recent?: number[] }) {
  const [open, setOpen] = useState(false)
  const panel = useId()
  const n = members.filter((m) => m.inToday).length
  const total = members.length
  const shown = members.slice(0, SHOWN)
  const extra = total - shown.length

  return (
    <div role="region" aria-label="Who’s in today" className="relative mt-3 rounded-lg bg-black/10 p-2 shadow-[inset_0_1px_0_rgb(255_255_255/.18)]">
      <div className="flex items-center gap-2">
        <ul className="flex min-w-0 items-center pl-1">
          {shown.map(({ person, inToday, isMe }, i) => {
            const arrived = arrivedId === person.id
            const avatar = <Avatar name={person.name} color={person.color} photoUrl={person.photoUrl} size="sm" pending={!inToday} className={cn(!inToday && 'opacity-80')} />
            return (
              <li key={person.id} data-person={person.id} className={cn('relative', i > 0 && '-ml-[6px]', arrived && 'animate-stickpop')}>
                {onPersonTap && !isMe ? (
                  <button type="button" onClick={() => onPersonTap(person.id)} aria-label={`View ${person.name}`} className="block rounded-full transition-transform duration-150 ease-out hover:-translate-y-0.5">
                    {avatar}
                  </button>
                ) : (
                  avatar
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute -bottom-[3px] -right-[3px] grid size-[15px] place-items-center rounded-full bg-on-color text-primary transition-transform duration-350 ease-spring',
                    inToday ? 'scale-100' : 'scale-0',
                    arrived && 'animate-tickpop',
                  )}
                >
                  <CheckIcon size={9} />
                </span>
                <span className="sr-only">{`${isMe ? 'You' : person.name}: ${inToday ? 'in today' : 'not yet'}`}</span>
              </li>
            )
          })}
          {extra > 0 && <li className="tnum -ml-[6px] grid size-8 place-items-center rounded-full bg-on-color text-[11px] font-bold text-white">+{extra}</li>}
        </ul>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panel}
          className="inline-flex items-center gap-2 rounded-full py-1 pl-2 pr-1 transition-colors duration-150 ease-out hover:bg-black/10"
        >
          <span className="tnum inline-flex items-baseline whitespace-nowrap font-display text-[22px] leading-none">
            <RollingCount n={n} tight label={`${n} of ${total} in today`} />
            <span aria-hidden="true" className="text-[14px] opacity-60">/{total}</span>
          </span>
          <span className="whitespace-nowrap text-[12px] font-bold">in today</span>
          <span className="grid size-7 place-items-center rounded-full bg-black/10">
            <ChevronIcon size={15} className={cn('transition-transform duration-200 ease-out', open && 'rotate-180')} />
          </span>
        </button>
      </div>

      {/* Opens by height (grid rows 0fr → 1fr), so nothing below jumps. */}
      <div id={panel} className={cn('grid transition-[grid-template-rows,opacity] duration-200 ease-out', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')} inert={!open}>
        <div className="min-h-0 overflow-hidden">
          <p className="px-1 pt-3 text-[13px] font-semibold">{heroLine(n, total, members.some((m) => m.isMe && m.inToday))}</p>
          {recent && recent.length > 1 && (
            <div className="mt-2 rounded-md bg-black/[.08] px-3 pb-2 pt-2">
              <div className="flex items-baseline justify-between text-[11.5px] font-bold">
                <span>Last 14 days</span>
                <span className="opacity-70">today</span>
              </div>
              {open && (
                <Sparkline
                  values={recent}
                  height={40}
                  className="mt-1"
                  label="Members in each day, last 14 days"
                  pointLabel={(i) => {
                    const day = addDays(new Date(), i - (recent.length - 1))
                    const when = i === recent.length - 1 ? 'Today' : day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
                    return `${when} · ${recent[i]} in`
                  }}
                />
              )}
            </div>
          )}
          <div aria-hidden="true" className="mt-3 flex gap-[5px] px-1 pb-1">
            {members.map((m, i) => (
              <span key={m.person.id} className="relative h-2 flex-1 overflow-hidden rounded-full bg-black/10">
                <span className={cn('absolute inset-0 origin-left bg-on-color transition-transform duration-200 ease-out', i < n ? 'scale-x-100' : 'scale-x-0')} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
