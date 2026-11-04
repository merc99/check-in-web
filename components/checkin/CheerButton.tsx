'use client'

import { Megaphone } from 'lucide-react'
import { useRef, useState } from 'react'
import { burstFrom } from '@/components/fx/burst'
import { RollingCount } from '@/components/fx/RollingCount'
import { sfx } from '@/components/fx/sound'
import type { Hue } from '@/lib/colors'
import type { Person } from '@/lib/data'
import { cn } from '@/lib/utils'

/**
 * Cheer a milestone post: bigger than an emoji reaction, one per person. Pressing it pops the
 * button, sends a small burst in the crew's color and rolls the count (delight moment).
 */
export function CheerButton({
  count, byMe, people, color, onCheer, isMine,
}: { count: number; byMe: boolean; people: Person[]; color: Hue; onCheer: (on: boolean) => void; isMine: boolean }) {
  const btn = useRef<HTMLButtonElement>(null)
  const [pop, setPop] = useState(0)
  const press = () => {
    const on = !byMe
    onCheer(on)
    if (on) {
      setPop((p) => p + 1)
      if (btn.current) burstFrom(btn.current, [`--${color}`, '--lemon', 'white', '--primary'], 18)
      sfx('tap')
    }
  }
  const names = people.map((p) => p.name)
  const others = count - names.length - (byMe ? 1 : 0)
  const who = [...(byMe ? ['you'] : []), ...names]
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {!isMine ? (
        <button
          ref={btn}
          type="button"
          aria-pressed={byMe}
          onClick={press}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] font-bold transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[.95]',
            byMe ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong bg-card hover:bg-muted',
          )}
        >
          <Megaphone key={pop} size={17} strokeWidth={2} className={cn(pop > 0 && 'animate-bump')} aria-hidden="true" />
          {byMe ? 'Cheered' : 'Cheer'}
          {count > 0 && (
            <span className="tnum">
              <RollingCount n={count} />
            </span>
          )}
        </button>
      ) : (
        count > 0 && (
          <span className="inline-flex items-center gap-2 text-[14px] font-bold">
            <Megaphone size={17} strokeWidth={2} aria-hidden="true" />
            <span className="tnum">
              <RollingCount n={count} />
            </span>{' '}
            cheer{count === 1 ? '' : 's'}
          </span>
        )
      )}
      {who.length > 0 && (
        <span className="text-[13px] text-muted-foreground">
          Cheered by {who.slice(0, 3).join(', ')}
          {others > 0 ? ` and ${others} more` : ''}
        </span>
      )}
    </div>
  )
}
