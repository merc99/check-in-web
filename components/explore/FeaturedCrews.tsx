'use client'

import { Avatar } from '@/components/checkin/Avatar'
import { CrewBlock, CrewDot } from '@/components/checkin/CrewBlock'
import { RingCarousel } from '@/components/checkin/RingCarousel'
import { StatusTag } from '@/components/explore/CrewCard'
import type { ExploreGroup } from '@/lib/data'
import { cn } from '@/lib/utils'

/** How many crews ride the ring: 4 to 6 reads best as a ring. */
const MAX = 5

/**
 * The crews with the longest streaks, on a ring at the top of Explore. Tapping the front card
 * (or Enter) opens it, like a card in the list. Needs at least three crews to read as a ring.
 */
export function FeaturedCrews({ crews, onOpen }: { crews: ExploreGroup[]; onOpen: (id: string) => void }) {
  const featured = [...crews].sort((a, b) => b.streak - a.streak).slice(0, MAX)
  if (featured.length < 3) return null

  return (
    <RingCarousel
      label="Crews going strong"
      stageHeight={340}
      items={featured.map((c) => ({
        key: c.id,
        label: c.name,
        content: (
          // A neutral card; the cover photo (or the crew's medal) carries the color.
          <div className={cn('flex h-full flex-col overflow-hidden rounded-[inherit] border bg-card edge-lit', c.coverUrl ? 'p-0' : 'p-5')}>
            {c.coverUrl ? (
              <div className="relative h-[118px] flex-none overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.coverUrl} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
                <div className="absolute right-3 top-3">
                  <StatusTag status={c.status} className="border-white/25 bg-black/35 text-white" />
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <CrewBlock name={c.name} color={c.color} emoji={c.emoji} size="lg" />
                <StatusTag status={c.status} />
              </div>
            )}
            <div className={cn('flex min-h-0 flex-1 flex-col', c.coverUrl && 'px-5 pb-5')}>
              <p className="mt-4 flex items-center gap-2 text-[18px] font-medium leading-tight">
                <CrewDot color={c.color} className="size-2" />
                {c.name}
              </p>
              {c.description && <p className={cn('mt-1 text-[13px] text-muted-foreground', c.coverUrl ? 'line-clamp-2' : 'line-clamp-3')}>{c.description}</p>}
              <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
                <span className="flex">
                  {c.preview.slice(0, 4).map((p, i) => (
                    <Avatar key={p.id} name={p.name} color={p.color} photoUrl={p.photoUrl} size="xs" className={i ? '-ml-2' : undefined} />
                  ))}
                </span>
                <span className="font-mono text-[12px] text-muted-foreground">
                  <span className="tnum text-foreground">{c.streak}</span>-day streak
                </span>
              </div>
            </div>
          </div>
        ),
      }))}
      onTap={(i) => onOpen(featured[i].id)}
    />
  )
}
