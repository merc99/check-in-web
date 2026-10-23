'use client'

import { Avatar } from '@/components/checkin/Avatar'
import { CrewBlock } from '@/components/checkin/CrewBlock'
import { RingCarousel } from '@/components/checkin/RingCarousel'
import { StatusTag } from '@/components/explore/CrewCard'
import type { ExploreGroup } from '@/lib/data'

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
          <div className="flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <CrewBlock name={c.name} color={c.color} size="lg" />
              <StatusTag status={c.status} />
            </div>
            <p className="mt-4 font-display text-[22px] leading-[1.05] tracking-tighter">{c.name}</p>
            {c.description && <p className="mt-2 line-clamp-3 text-[13.5px] text-muted-foreground">{c.description}</p>}
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
              <span className="flex">
                {c.preview.slice(0, 4).map((p, i) => (
                  <Avatar key={p.id} name={p.name} color={p.color} photoUrl={p.photoUrl} size="xs" className={i ? '-ml-2' : undefined} />
                ))}
              </span>
              <span className="text-[12.5px] font-bold">
                <span className="tnum">{c.streak}</span>-day streak
              </span>
            </div>
          </div>
        ),
      }))}
      onTap={(i) => onOpen(featured[i].id)}
    />
  )
}
