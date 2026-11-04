'use client'

import { Pencil } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Avatar } from '@/components/checkin/Avatar'
import { CrewTint, engraved, tintWell } from '@/components/checkin/CrewTint'
import { TierMedal } from '@/components/checkin/TierCard'
import { RollingCount } from '@/components/fx/RollingCount'
import type { Hue } from '@/lib/colors'
import type { MyStats, Person } from '@/lib/data'
import { tierOf, type TierKey } from '@/lib/mastery'
import { cn } from '@/lib/utils'

/**
 * The top of You: your own card, in your color (Ben, Nov 2026: make You more appealing). Your avatar,
 * name, handle and bio, your top tier as a small tile, and the three numbers that matter on a dark
 * ink strip: all time (the sacred one, biggest), the day streak and your best. Digits roll up on open.
 */
export function YouHero({
  person, handle, bio, stats, topTier,
}: {
  person: Person
  handle: string | null
  bio: string | null
  stats: MyStats
  topTier: { tier: TierKey; crewName: string } | null
}) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  const n = (v: number) => (ready ? v : 0)

  return (
    <CrewTint hue={person.color as Hue} level="glow" className="mt-6 rounded-xl p-5 [--roll-ms:900ms] lg:p-6">
      <Link
        href="/profile/edit"
        aria-label="Edit profile"
        className="hit-44 absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-black/10 text-foreground transition-[transform,background-color] duration-150 ease-out hover:bg-black/20 active:scale-[.97] dark:bg-black/25 dark:hover:bg-black/40"
      >
        <Pencil size={15} />
      </Link>

      <div className="relative flex items-center gap-4 pr-10 lg:gap-5">
        <Avatar name={person.name} color={person.color} photoUrl={person.photoUrl} size="xl" you className="max-sm:size-[84px] max-sm:text-[38px]" />
        <div className="min-w-0 flex-1">
          <h1 className={cn(engraved, 'wrap-break-word text-[26px] font-medium leading-tight tracking-tight sm:text-[30px]')}>{person.name}</h1>
          {handle && <p className="mt-0.5 text-[14px] text-muted-foreground">@{handle}</p>}
          {topTier && (
            <p className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-black/10 py-1 pl-1 pr-3 text-[13px] dark:bg-black/25">
              <TierMedal tier={topTier.tier} size="sm" />
              <span className="font-medium">{tierOf(topTier.tier).name}</span>
              <span className="truncate text-muted-foreground">{topTier.crewName}</span>
            </p>
          )}
        </div>
      </div>
      {bio && <p className="relative mt-4 text-[15px] leading-snug">{bio}</p>}

      {/* The numbers: overlays on a hue are dark ink, never white. */}
      <dl className={cn('relative mt-5 grid grid-cols-[1.3fr_1fr_1fr] divide-x divide-black/10 rounded-lg py-3 dark:divide-white/[.07]', tintWell)}>
        <Figure label="All time" unit="check-ins" big>
          <RollingCount n={n(stats.total)} tight label={`${stats.total} check-ins, all time`} />
        </Figure>
        <Figure label="Streak" unit="days">
          <span data-fx-streak="" className="inline-block">
            <RollingCount n={n(stats.streak)} tight label={`${stats.streak}-day streak`} />
          </span>
        </Figure>
        <Figure label="Best" unit="days">
          <RollingCount n={n(stats.best)} tight label={`Best streak ${stats.best} days`} />
        </Figure>
      </dl>
    </CrewTint>
  )
}

function Figure({ label, unit, big, children }: { label: string; unit: string; big?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col justify-between px-4 max-[360px]:px-3">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="mt-1.5">
        <span className={big ? 'block text-[34px] font-medium leading-none tracking-tightest' : 'block text-[26px] font-medium leading-none tracking-tighter'}>{children}</span>
        <span className="mt-1 block font-mono text-[11px] text-muted-foreground">{unit}</span>
      </dd>
    </div>
  )
}
