'use client'

import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { CrewBlock } from '@/components/ui/CrewBlock'
import { CheckIcon } from '@/components/ui/icons'
import { List, listRow } from '@/components/ui/List'
import { Sheet } from '@/components/ui/Sheet'
import { StatCard } from '@/components/ui/StatCard'
import { cn } from '@/lib/cn'
import { COLOR_CLASS } from '@/lib/colors'
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
  useEffect(() => {
    if (crewId) setShownId(crewId)
  }, [crewId])

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
          <div className={cn('-mx-5 mb-5 flex items-center gap-4 border-y border-ink px-5 py-6', COLOR_CLASS[d.color].bg)}>
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
                    <span className="text-xl text-ink-mute">/{d.maxMembers}</span>
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
                  <span className="text-xs text-ink-mute">day streak</span>
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
