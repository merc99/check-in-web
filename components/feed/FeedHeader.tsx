'use client'

import { CrewDot } from '@/components/ui/CrewBlock'
import { IconLink } from '@/components/ui/IconButton'
import { ChevronIcon, GearIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import type { BrandColor } from '@/lib/colors'
import { useScrolledPast } from '@/lib/motion'

/**
 * Large-title header. Past 70px of scroll the big title is gone and a compact crew
 * name rises into the sticky bar instead. Both open the crew switcher.
 */
export function FeedHeader({
  group, onSwitch,
}: { group: { id: string; name: string; color: BrandColor }; onSwitch: () => void }) {
  const collapsed = useScrolledPast(70)
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-20 -mx-5 flex items-center gap-3 border-b px-5 pb-[10px] pt-[14px] transition-colors duration-200',
          collapsed ? 'border-rule bg-peach' : 'border-transparent bg-transparent',
        )}
      >
        <button
          type="button"
          onClick={onSwitch}
          aria-label="Switch crew"
          tabIndex={collapsed ? 0 : -1}
          aria-hidden={!collapsed}
          className={cn(
            'inline-flex min-w-0 items-center gap-2 px-1 py-[6px] font-display text-[17px] transition-[opacity,transform] duration-300 ease-spring',
            collapsed ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
          )}
        >
          <CrewDot color={group.color} />
          <span className="truncate">{group.name}</span>
          <ChevronIcon size={16} className="flex-none" />
        </button>
        <span className="flex-1" />
        <IconLink href={`/group-settings/${group.id}`} label="Crew settings">
          <GearIcon size={19} />
        </IconLink>
      </header>

      <div className="pb-5 pt-1">
        <p className="text-[13.5px] font-medium text-ink-soft">{date}</p>
        <h1 className="mt-[6px]">
          <button
            type="button"
            onClick={onSwitch}
            aria-haspopup="dialog"
            className="group flex max-w-full items-center gap-2 text-left font-display text-[40px] leading-[.95] max-[380px]:text-[34px]"
          >
            {group.name}
            <ChevronIcon size={26} className="flex-none transition-transform duration-200 ease-spring group-hover:translate-y-[3px]" />
          </button>
        </h1>
      </div>
    </>
  )
}
