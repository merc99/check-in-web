'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { burstFrom } from '@/components/fx/burst'
import type { Hue } from '@/lib/colors'
import { MemberSticker } from '@/components/checkin/MemberSticker'
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
  color, members, arrivedId, onPersonTap, onWave, waved, recent,
}: {
  color: Hue
  members: HeroMember[]
  arrivedId?: string | null
  onPersonTap?: (id: string) => void
  onWave?: (id: string) => void
  waved?: (id: string) => boolean
  recent?: number[]
}) {
  const [open, setOpen] = useState(false)
  const panel = useId()
  const n = members.filter((m) => m.inToday).length
  const total = members.length
  const shown = members.slice(0, SHOWN)
  const extra = total - shown.length
  const allIn = total > 1 && n === total

  // The whole-crew moment (phones): when the last person checks in while you're watching, the
  // "all in" pops and a small burst rises from the strip, once. Not on load, not on a crew switch.
  const strip = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const was = useRef<boolean | null>(null)
  useEffect(() => {
    const before = was.current
    was.current = allIn
    if (before !== false || !allIn) return
    const t = window.setTimeout(() => {
      if (strip.current) burstFrom(strip.current, [`--${color}`, '--primary', '--lemon', 'white'], 34)
      label.current?.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
        { duration: 450, easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' },
      )
    }, 700) // after the last sticker's own pop
    return () => window.clearTimeout(t)
  }, [allIn, color])

  return (
    <div ref={strip} role="region" aria-label="Who’s in today" className="relative mt-3 rounded-lg bg-black/10 p-2 shadow-[inset_0_1px_0_rgb(255_255_255/.18)]">
      <div className="flex items-center gap-2">
        <ul className="flex min-w-0 items-center pl-1">
          {shown.map(({ person, inToday, isMe }, i) => (
            <MemberSticker
              key={person.id}
              person={person}
              inToday={inToday}
              isMe={isMe}
              size="sm"
              arrived={arrivedId === person.id}
              waved={waved?.(person.id)}
              onTap={onPersonTap}
              onWave={onWave}
              className={i > 0 ? '-ml-[6px]' : undefined}
            />
          ))}
          {extra > 0 && <li className="tnum -ml-[6px] grid size-8 place-items-center rounded-full bg-on-color text-[12px] font-bold text-white">+{extra}</li>}
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
          {/* The whole crew in is the moment the app is for: say it, in the crew's ink with a check. */}
          {allIn ? (
            <span ref={label} className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-bold">
              <CheckIcon size={12} /> all in
            </span>
          ) : (
            <span className="whitespace-nowrap text-[12px] font-bold">in today</span>
          )}
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
              <div className="flex items-baseline justify-between text-[12px] font-bold">
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
