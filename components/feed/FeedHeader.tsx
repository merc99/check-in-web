'use client'

import { Flame, Users } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { CrewDot } from '@/components/checkin/CrewBlock'
import { CrewSurface } from '@/components/checkin/CrewSurface'
import { IconLink } from '@/components/checkin/IconButton'
import { ChevronIcon, GearIcon } from '@/components/checkin/icons'
import { HoloBanner } from '@/components/fx/loops'
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
  const date = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
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

      {/* The banner, kept compact so the feed leads: the crew's own surface with a slow holographic
          gradient, the name (tap to switch crews), one line of facts and the gear. */}
      <CrewSurface hue={group.color} className="mb-4 mt-4 rounded-xl px-4 py-[14px] sm:px-5 sm:py-4">
        {/* A slow holographic gradient in the crew's hue (fx/HoloBanner, the banner's one loop). */}
        <HoloBanner />
        <div className="relative flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1>
              <button
                type="button"
                onClick={onSwitch}
                aria-haspopup="dialog"
                className="group inline-flex max-w-full items-center gap-1 text-left font-display text-[24px] font-extrabold leading-[1.1] tracking-tighter sm:text-[28px]"
              >
                <span className="truncate">{group.name}</span>
                <ChevronIcon
                  size={18}
                  className="flex-none opacity-55 transition-[transform,opacity] duration-150 ease-out group-hover:translate-y-px group-hover:opacity-90"
                />
              </button>
            </h1>
            <p className="mt-[2px] flex flex-wrap items-center gap-x-3 gap-y-[2px] text-[12.5px] font-semibold">
              <span className="opacity-70">{date}</span>
              <span className="inline-flex items-center gap-[5px] opacity-75">
                <Users size={14} strokeWidth={2} aria-hidden="true" />
                <span>
                  <span className="tnum">{group.memberCount}</span> members
                </span>
              </span>
              {group.streak > 1 && (
                <span className="inline-flex items-center gap-[5px]">
                  <Flame size={14} strokeWidth={2.25} aria-hidden="true" />
                  <span>
                    <span className="tnum">{group.streak}</span>-day crew streak
                  </span>
                </span>
              )}
            </p>
          </div>
          <Link
            href={`/group-settings/${group.id}`}
            aria-label="Crew settings"
            className="grid size-10 flex-none place-items-center rounded-full bg-black/10 transition-colors duration-150 ease-out hover:bg-black/20"
          >
            <GearIcon size={18} />
          </Link>
        </div>
        {today}
      </CrewSurface>
    </>
  )
}
