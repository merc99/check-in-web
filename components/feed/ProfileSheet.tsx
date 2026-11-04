'use client'

import { useState } from 'react'
import { Avatar } from '@/components/checkin/Avatar'
import { ResponsiveSheet } from '@/components/checkin/ResponsiveSheet'
import { StatCard } from '@/components/checkin/StatCard'
import { Binder } from '@/components/checkin/Binder'
import { BadgeDisc, RankEmblem } from '@/components/checkin/Progression'
import { getBinder, getFlexOf, getUserProfile, useQuery } from '@/lib/data'
import { rankOf } from '@/lib/progression'
import { monthYear } from '@/lib/dates'

/** Tap any crewmate's avatar or name: who they are, their level and showcase badge, their counts, which crews you share. */
export function ProfileSheet({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  // Keep showing the last person while the sheet slides away.
  const [shownId, setShownId] = useState(userId)
  if (userId && userId !== shownId) setShownId(userId)

  const profile = useQuery(() => (shownId ? getUserProfile(shownId) : Promise.resolve(null)), [shownId], ['check_ins', 'group_members', 'profiles'])
  const p = profile.data
  const flex = useQuery(() => (shownId ? getFlexOf(shownId) : Promise.resolve(null)), [shownId], ['check_ins', 'group_members', 'profiles']).data
  const binder = useQuery(() => (shownId ? getBinder(shownId) : Promise.resolve(null)), [shownId], ['check_ins', 'group_members', 'vouches', 'profiles'])

  return (
    <ResponsiveSheet
      open={!!userId}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title={p ? p.person.name : 'Profile'}
      titleHidden
      detents={[0.6, 0.92]}
    >
      {p && (
        <div className="flex flex-col gap-4 text-center">
          <div className="flex justify-center pt-2">
            <Avatar name={p.person.name} color={p.person.color} photoUrl={p.person.photoUrl} size="xl" className="rotate-[-4deg]" />
          </div>
          <h2 className="font-display text-[30px] leading-none">{p.person.name}</h2>
          <p className="text-muted-foreground">Member since {monthYear(p.memberSince)}</p>
          {/* Progression: their level and rank, and the badge they chose to show. */}
          {flex && (
            <div className="flex items-stretch gap-3 text-left">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border bg-card p-3 edge-lit">
                <RankEmblem level={flex.level} rank={flex.rank} size="md" />
                <span className="min-w-0">
                  <span className="block text-[13px] text-muted-foreground">{rankOf(flex.rank).name}</span>
                  <span className="block text-[17px] font-medium leading-tight">Level {flex.level}</span>
                </span>
              </div>
              {flex.badge && (
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border bg-card p-3 edge-lit">
                  <BadgeDisc badgeKey={flex.badge.key} size="md" />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium leading-tight">{flex.badge.name}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">{flex.badge.crewName ?? flex.badge.subtitle}</span>
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-left">
            <StatCard big value={p.total} label="check-ins, all time" />
            <StatCard value={p.streak} label="day streak" />
            <StatCard value={p.sharedGroups.length} label="crews with you" />
          </div>
          {binder.data && binder.data.cards.length > 0 && (
            <div className="text-left">
              <p className="mb-2 text-[13px] font-medium">Top cards</p>
              <Binder binder={binder.data} compact />
            </div>
          )}
          {p.sharedGroups.length > 0 && (
            <p className="text-[14px] text-muted-foreground">
              You’re both in {p.sharedGroups.map((g) => g.name).join(' and ')}.
            </p>
          )}
        </div>
      )}
    </ResponsiveSheet>
  )
}
