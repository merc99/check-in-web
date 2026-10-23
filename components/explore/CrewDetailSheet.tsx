'use client'

import { useState } from 'react'
import { Avatar } from '@/components/checkin/Avatar'
import { Button } from '@/components/checkin/Button'
import { CrewBlock } from '@/components/checkin/CrewBlock'
import { CheckIcon } from '@/components/checkin/icons'
import { List, listRow } from '@/components/checkin/List'
import { Sheet } from '@/components/checkin/Sheet'
import { StatCard } from '@/components/checkin/StatCard'
import { cn } from '@/lib/utils'
import { HUE_CLASS } from '@/lib/colors'
import { getExploreDetails, useQuery } from '@/lib/data'

/** A public crew up close: who's in, their streaks, and the one action that fits. */
export function CrewDetailSheet({
  crewId, onClose, onRequest, onOpenFeed,
}: {
  crewId: string | null
  onClose: () => void
  onRequest: (id: string) => void
  onOpenFeed: (id: string) => void
}) {
  // Keep the last crew on screen while the sheet slides away.
  const [shownId, setShownId] = useState(crewId)
  if (crewId && crewId !== shownId) setShownId(crewId)

  const detail = useQuery(
    () => (shownId ? getExploreDetails(shownId) : Promise.resolve(null)),
    [shownId],
    ['group_members', 'join_requests', 'check_ins'],
  )
  const d = detail.data

  return (
    <Sheet open={!!crewId} onClose={onClose} label={d?.name ?? 'Crew'}>
      {d && (
        <>
          <div className={cn('-mx-5 mb-5 flex items-center gap-4 border-y border-border px-5 py-6', HUE_CLASS[d.color].soft)}>
            <CrewBlock name={d.name} color={d.color} size="lg" white />
            <div>
              <h2 className="font-display text-[30px] leading-[.95]">{d.name}</h2>
              {d.description && <p className="mt-[6px] font-medium">{d.description}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                value={
                  <>
                    {d.memberCount}
                    <span className="text-xl text-muted-foreground">/{d.maxMembers}</span>
                  </>
                }
                label="members"
              />
              <StatCard value={d.streak} label="day crew streak" />
            </div>
            <List>
              {d.members.map((m) => (
                <div key={m.person.id} className={listRow}>
                  <Avatar name={m.person.name} color={m.person.color} photoUrl={m.person.photoUrl} size="sm" you={m.isMe} />
                  <span className="min-w-0 flex-1 font-medium">{m.isMe ? 'You' : m.person.name}</span>
                  <span className="tnum font-display text-[17px]">{m.streak}</span>
                  <span className="text-xs text-muted-foreground">day streak</span>
                </div>
              ))}
            </List>
            {d.status === null && (
              <Button variant="primary" block onClick={() => onRequest(d.id)}>
                Request to join
              </Button>
            )}
            {d.status === 'member' && (
              <Button block onClick={() => onOpenFeed(d.id)}>
                Open the feed
              </Button>
            )}
            {d.status === 'pending' && (
              <Button block disabled>
                <CheckIcon size={16} /> Request sent, the crew will see it
              </Button>
            )}
            {d.status === 'full' && (
              <Button block disabled>
                This crew is full right now
              </Button>
            )}
          </div>
        </>
      )}
    </Sheet>
  )
}
