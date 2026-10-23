'use client'

import { useState } from 'react'
import { Avatar } from '@/components/checkin/Avatar'
import { Sheet } from '@/components/checkin/Sheet'
import { StatCard } from '@/components/checkin/StatCard'
import { getUserProfile, useQuery } from '@/lib/data'
import { monthYear } from '@/lib/dates'

/** Tap any crewmate's avatar: who they are, their counts, which crews you share. */
export function ProfileSheet({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  // Keep showing the last person while the sheet slides away.
  const [shownId, setShownId] = useState(userId)
  if (userId && userId !== shownId) setShownId(userId)

  const profile = useQuery(() => (shownId ? getUserProfile(shownId) : Promise.resolve(null)), [shownId], ['check_ins', 'group_members', 'profiles'])
  const p = profile.data

  return (
    <Sheet open={!!userId} onClose={onClose} label={p ? p.person.name : 'Profile'}>
      {p && (
        <div className="flex flex-col gap-4 text-center">
          <div className="flex justify-center pt-2">
            <Avatar name={p.person.name} color={p.person.color} photoUrl={p.person.photoUrl} size="xl" className="rotate-[-4deg]" />
          </div>
          <h2 className="font-display text-[30px] leading-none">{p.person.name}</h2>
          <p className="text-muted-foreground">Member since {monthYear(p.memberSince)}</p>
          <div className="grid grid-cols-2 gap-3 text-left">
            <StatCard big value={p.total} label="check-ins, all time" />
            <StatCard value={p.streak} label="day streak" />
            <StatCard value={p.sharedGroups.length} label="crews with you" />
          </div>
          {p.sharedGroups.length > 0 && (
            <p className="text-[13.5px] text-muted-foreground">
              You’re both in {p.sharedGroups.map((g) => g.name).join(' and ')}.
            </p>
          )}
        </div>
      )}
    </Sheet>
  )
}
