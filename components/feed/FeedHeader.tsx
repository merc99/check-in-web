'use client'

import { Flame, Users } from 'lucide-react'
import { useRef, type CSSProperties } from 'react'
import { CrewBlock, CrewDot } from '@/components/checkin/CrewBlock'
import { IconLink } from '@/components/checkin/IconButton'
import { ChevronIcon, GearIcon } from '@/components/checkin/icons'
import { shineClass, useShine } from '@/components/fx/shine'
import { cn } from '@/lib/utils'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import { useScrolledPast } from '@/lib/motion'

export interface FeedHeaderCrew {
  id: string
  name: string
  color: Hue
  memberCount: number
  inToday: number
  /** Crew streak: consecutive days with someone in. */
  streak: number
}

/**
 * The crew you're looking at, as a banner in the crew's color: its block, the date, the big name
 * (tap to switch crews) and a line of facts. Past 70px of scroll it collapses into a tinted sticky
 * bar with the crew's dot and name. Both open the crew switcher; the gear opens crew settings.
 */
export function FeedHeader({ group, onSwitch }: { group: FeedHeaderCrew; onSwitch: () => void }) {
  const collapsed = useScrolledPast(70)
  const banner = useRef<HTMLDivElement>(null)
  useShine(banner)
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

      <div
        ref={banner}
        className={cn('mb-5 mt-5 overflow-hidden rounded-xl border border-border p-5 shadow-card', shineClass, hue.soft)}
        style={{ backgroundImage: `radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, ${hue.cssVar} 38%, transparent), transparent 60%)` }}
      >
        <div className="flex items-start gap-4">
          <CrewBlock name={group.name} color={group.color} size="lg" className="max-sm:hidden" />
          <div className="min-w-0 flex-1">
            <p className={cn('text-[13px] font-semibold', hue.ink)}>{date}</p>
            <h1 className="mt-1">
              <button
                type="button"
                onClick={onSwitch}
                aria-haspopup="dialog"
                className="group text-left font-display text-[30px] leading-[1] sm:text-[38px] sm:leading-[.95]"
              >
                {/* The chevron rides on the last word, so a long name never strands it on its own line. */}
                <span className="break-words">{group.name}</span>
                <span className="ml-2 inline-grid size-7 translate-y-[-3px] place-items-center rounded-full bg-card/70 align-middle shadow-xs transition-transform duration-150 ease-out group-hover:translate-y-[-1px] sm:size-8">
                  <ChevronIcon size={18} />
                </span>
              </button>
            </h1>
          </div>
          <IconLink href={`/group-settings/${group.id}`} label="Crew settings">
            <GearIcon size={19} />
          </IconLink>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2 text-[12.5px] font-bold">
          <li className="inline-flex items-center gap-[6px] rounded-full bg-card/70 px-3 py-[6px] shadow-xs">
            <Users size={14} strokeWidth={2} aria-hidden="true" />
            <span className="tnum">{group.memberCount}</span> members
          </li>
          {group.streak > 1 && (
            <li className="inline-flex items-center gap-[6px] rounded-full bg-foreground px-3 py-[6px] text-background shadow-xs">
              <Flame size={14} strokeWidth={2.25} aria-hidden="true" />
              <span>
                <span className="tnum">{group.streak}</span>-day crew streak
              </span>
            </li>
          )}
        </ul>
      </div>
    </>
  )
}
