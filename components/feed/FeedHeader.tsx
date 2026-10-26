'use client'

import { Flame, Users } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { CrewDot } from '@/components/checkin/CrewBlock'
import { CrewCover } from '@/components/checkin/CrewCover'
import { CrewMedal, CrewSurface } from '@/components/checkin/CrewSurface'
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

      {/* The banner: the crew's own surface (hue with depth and grain), a faint cover pattern, the name
          large, the facts as plain text, and the crew's emoji as an enamel badge. */}
      <CrewSurface hue={group.color} className="mb-5 mt-5 rounded-xl p-5 sm:p-6">
        <CrewCover pattern={group.pattern} className="text-on-color opacity-[.07]" />
        {/* A glint of light crosses the banner every few seconds (fx/LightSweep, the banner's one loop). */}
        <LightSweep />
        <div className="relative flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold opacity-70">{date}</p>
          <Link
            href={`/group-settings/${group.id}`}
            aria-label="Crew settings"
            className="-my-1 grid size-10 flex-none place-items-center rounded-full bg-black/10 transition-colors duration-150 ease-out hover:bg-black/20"
          >
            <GearIcon size={18} />
          </Link>
        </div>
        <div className="relative mt-2 flex items-end gap-4">
          <div className="min-w-0 flex-1">
            <h1>
              <button
                type="button"
                onClick={onSwitch}
                aria-haspopup="dialog"
                className="group text-left font-display text-[40px] font-extrabold leading-[.92] tracking-tighter sm:text-[54px]"
              >
                {/* The chevron rides on the last word, so a long name never strands it on its own line. */}
                <span className="break-words">{group.name}</span>
                <ChevronIcon
                  size={22}
                  className="ml-1 inline-block translate-y-[-4px] opacity-55 transition-[transform,opacity] duration-150 ease-out group-hover:translate-y-[-2px] group-hover:opacity-90"
                />
              </button>
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] font-semibold">
              <span className="inline-flex items-center gap-[6px] opacity-75">
                <Users size={15} strokeWidth={2} aria-hidden="true" />
                <span>
                  <span className="tnum">{group.memberCount}</span> members
                </span>
              </span>
              {group.streak > 1 && (
                <span className="inline-flex items-center gap-[6px]">
                  <Flame size={15} strokeWidth={2.25} aria-hidden="true" />
                  <span>
                    <span className="tnum">{group.streak}</span>-day crew streak
                  </span>
                </span>
              )}
            </p>
          </div>
          <CrewMedal name={group.name} emoji={group.emoji} className="size-[60px] text-[28px] sm:size-[76px] sm:text-[36px]" />
        </div>
        {today}
      </CrewSurface>
    </>
  )
}
