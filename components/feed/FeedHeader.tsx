'use client'

import { Flame, Users } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { CrewDot } from '@/components/checkin/CrewBlock'
import { CrewCover } from '@/components/checkin/CrewCover'
import { IconLink } from '@/components/checkin/IconButton'
import { ChevronIcon, GearIcon } from '@/components/checkin/icons'
import { LightSweep } from '@/components/fx/loops'
import { cn } from '@/lib/utils'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import type { CrewPattern } from '@/lib/crewStyle'
import { useScrolledPast } from '@/lib/motion'

export interface FeedHeaderCrew {
  id: string
  name: string
  color: Hue
  emoji: string | null
  pattern: CrewPattern
  memberCount: number
  inToday: number
  /** Crew streak: consecutive days with someone in. */
  streak: number
}

/**
 * The crew you're looking at, as a banner in the crew's color with its own cover pattern: its emoji,
 * the date, the big name (tap to switch crews), a line of facts and, on phones, who's in today
 * (`today`, a TodayStrip). Past 70px of scroll it collapses into a tinted sticky bar with the crew's
 * dot and name. Both open the crew switcher; the gear opens crew settings.
 */
export function FeedHeader({ group, onSwitch, today }: { group: FeedHeaderCrew; onSwitch: () => void; today?: ReactNode }) {
  const collapsed = useScrolledPast(70)
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const hue = HUE_CLASS[group.color]

  return (
    <>
      <header
        // Takes no space until you scroll (the banner below holds the gear); then it's the tinted bar.
        className={cn(
          'sticky top-0 z-20 -mx-5 -mb-[66px] flex h-[66px] items-center gap-3 border-b px-5 transition-[background-color,border-color,opacity] duration-200',
          collapsed ? cn('border-border opacity-100 backdrop-blur-xl', hue.soft) : 'pointer-events-none border-transparent bg-transparent opacity-0',
        )}
        // Over the page, the tint needs the page behind it so it stays opaque enough to read.
        style={collapsed ? ({ backgroundColor: `color-mix(in srgb, ${hue.cssVar} 14%, var(--background))` } as CSSProperties) : undefined}
      >
        <button
          type="button"
          onClick={onSwitch}
          aria-label="Switch crew"
          tabIndex={collapsed ? 0 : -1}
          aria-hidden={!collapsed}
          className={cn(
            'inline-flex min-w-0 items-center gap-2 px-1 py-[6px] font-display text-[17px] transition-[opacity,transform] duration-200 ease-out',
            collapsed ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
          )}
        >
          <CrewDot color={group.color} />
          <span className="truncate">{group.name}</span>
          <ChevronIcon size={16} className="flex-none" />
        </button>
        <span className="flex-1" />
        {collapsed && (
          <IconLink href={`/group-settings/${group.id}`} label="Crew settings">
            <GearIcon size={19} />
          </IconLink>
        )}
      </header>

      {/* The banner is the crew's own color, flat, with its cover pattern fading in from the right. */}
      <div className={cn('relative isolate mb-5 mt-5 overflow-hidden rounded-xl p-5 text-on-color shadow-card', hue.solid)}>
        <CrewCover pattern={group.pattern} className="text-on-color opacity-[.13]" />
        {/* A glint of light crosses the banner every few seconds (fx/LightSweep, the banner's one loop). */}
        <LightSweep />
        <div className="relative flex items-center gap-[14px]">
          <span
            aria-hidden="true"
            className="grid size-[52px] flex-none rotate-[-5deg] place-items-center rounded-[16px] bg-white/85 font-display text-[26px] leading-none shadow-[0_6px_14px_-6px_rgb(0_0_0/.35)] sm:size-16 sm:rounded-[20px] sm:text-[32px]"
          >
            {group.emoji ?? (group.name.trim()[0] ?? '?').toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold opacity-75">{date}</p>
            <h1 className="mt-[3px]">
              <button
                type="button"
                onClick={onSwitch}
                aria-haspopup="dialog"
                className="group text-left font-display text-[26px] leading-[1] tracking-tighter sm:text-[38px] sm:leading-[.95]"
              >
                {/* The chevron rides on the last word, so a long name never strands it on its own line. */}
                <span className="break-words">{group.name}</span>
                <span className="ml-[6px] inline-grid size-6 translate-y-[-3px] place-items-center rounded-full bg-white/45 align-middle transition-transform duration-150 ease-out group-hover:translate-y-[-1px] sm:size-8">
                  <ChevronIcon size={16} />
                </span>
              </button>
            </h1>
          </div>
          {/* Light on the hue in both themes (a card-colored button would go black in dark mode). */}
          <Link
            href={`/group-settings/${group.id}`}
            aria-label="Crew settings"
            className="grid size-11 flex-none place-items-center self-start rounded-full bg-white/45 transition-colors duration-150 ease-out hover:bg-white/70"
          >
            <GearIcon size={19} />
          </Link>
        </div>
        <ul className="relative mt-4 flex flex-wrap gap-2 text-[12.5px] font-bold">
          <li className="inline-flex items-center gap-[6px] rounded-full bg-white/45 px-3 py-[6px]">
            <Users size={14} strokeWidth={2} aria-hidden="true" />
            <span className="tnum">{group.memberCount}</span> members
          </li>
          {group.streak > 1 && (
            <li className="inline-flex items-center gap-[6px] rounded-full bg-on-color px-3 py-[6px] text-white">
              <Flame size={14} strokeWidth={2.25} aria-hidden="true" />
              <span>
                <span className="tnum">{group.streak}</span>-day crew streak
              </span>
            </li>
          )}
        </ul>
        {today}
      </div>
    </>
  )
}
