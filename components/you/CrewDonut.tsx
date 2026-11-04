'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useActiveCrew } from '@/lib/activeCrew'
import { HUE_CLASS } from '@/lib/colors'
import type { MyInsights } from '@/lib/data'
import { cn } from '@/lib/utils'

/**
 * Where your check-ins went (reference: Chord "Monthly spend"): the total, one stacked bar split by
 * crew in each crew's hue (a share is one bar, not a ring), and a legend with mono figures. Hovering a
 * segment or a row highlights the pair; a row opens that crew's feed.
 */
export function CrewDonut({ crews }: { crews: MyInsights['byCrew'] }) {
  const router = useRouter()
  const { setActiveId } = useActiveCrew()
  const [hover, setHover] = useState<string | null>(null)
  const total = crews.reduce((n, c) => n + c.count, 0)

  const open = (id: string) => {
    setActiveId(id)
    router.push('/feed')
  }

  return (
    <div className="rounded-xl border bg-card p-5 edge-lit">
      <p className="flex items-baseline gap-2">
        <span className="tnum text-[32px] font-medium leading-none tracking-tighter">{total}</span>
        <span className="text-[13px] text-muted-foreground">
          check-ins across {crews.length} crew{crews.length === 1 ? '' : 's'}
        </span>
      </p>
      <div className="mt-4 flex h-3 gap-1" role="img" aria-label={crews.map((c) => `${c.name}: ${c.count}`).join(', ')}>
        {crews.map((c) => (
          <span
            key={c.id}
            onPointerEnter={() => setHover(c.id)}
            onPointerLeave={() => setHover(null)}
            className={cn('h-full rounded-full transition-opacity duration-150 ease-out', HUE_CLASS[c.color].solid, hover && hover !== c.id && 'opacity-35')}
            style={{ flexGrow: c.count, flexBasis: 0, minWidth: 6 }}
          />
        ))}
      </div>
      <ul className="mt-4 flex flex-col">
        {crews.map((c) => (
          <li key={c.id} className="border-t first:border-t-0">
            <button
              type="button"
              onClick={() => open(c.id)}
              onPointerEnter={() => setHover(c.id)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(c.id)}
              onBlur={() => setHover(null)}
              aria-label={`${c.name}: ${c.count} check-ins. Open its feed`}
              className={cn('-mx-2 flex w-[calc(100%+16px)] items-center gap-3 rounded-md px-2 py-[10px] text-left transition-colors duration-150 ease-out', hover === c.id ? 'bg-muted' : 'hover:bg-muted')}
            >
              <span className={cn('size-2 flex-none rounded-full', HUE_CLASS[c.color].solid)} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[14px]">{c.name}</span>
              <span className="tnum font-mono text-[12px] text-subtle-foreground">{total ? Math.round((c.count / total) * 100) : 0}%</span>
              <span className="tnum w-8 text-right font-mono text-[13px]">{c.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
