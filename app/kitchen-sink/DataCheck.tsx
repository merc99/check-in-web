'use client'

import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TagChip, ToggleChip } from '@/components/ui/Chip'
import { HeartIcon } from '@/components/ui/icons'
import { useLive } from '@/components/ui/LivePill'
import { useToast } from '@/components/ui/Toast'
import { checkIn, getFeed, getMyGroups, getMyStats, onCheckIn, toggleHeart, useQuery } from '@/lib/data'
import { timeAgo } from '@/lib/dates'
import { simulateArrival, SIMULATE_LIVE, useLiveSimulation } from '@/lib/mock/simulation'

/** Dev check for the mock data layer: reads, a write, realtime arrivals and the simulation. */
export function DataCheck() {
  const toast = useToast()
  const live = useLive()
  const [groupId, setGroupId] = useState('g1')
  const groups = useQuery(getMyGroups, [], ['groups', 'group_members', 'check_ins'])
  const stats = useQuery(getMyStats, [], ['check_ins'])
  const feed = useQuery(() => getFeed(groupId, { limit: 4 }), [groupId], ['check_ins', 'reactions', 'tags'])

  useLiveSimulation(groupId)

  useEffect(
    () =>
      onCheckIn(groupId, (item) => {
        if (item.isMine) return
        live({
          user: { name: item.user.name, color: item.user.color, photoUrl: item.user.photoUrl },
          message: (
            <>
              <b>{item.user.name}</b> just checked in
            </>
          ),
        })
      }),
    [groupId, live],
  )

  const run = (fn: () => Promise<unknown>, ok: string) =>
    fn().then(
      () => toast(ok),
      (e: Error) => toast(e.message),
    )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {groups.data?.map((g) => (
          <ToggleChip
            key={g.id}
            label={`${g.name} · ${g.inToday}/${g.memberCount}`}
            color={g.color}
            selected={g.id === groupId}
            onToggle={() => setGroupId(g.id)}
          />
        ))}
      </div>

      {stats.data && (
        <p className="tnum text-[13px] text-ink-soft">
          You: <b className="text-ink">{stats.data.total}</b> all time · {stats.data.streak}-day streak · best{' '}
          {stats.data.best} · {stats.data.checkedInToday ? 'in today' : 'not in yet'}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {feed.data?.map((item) => (
          <Card key={item.id} className={item.isMine ? 'bg-card-alt' : undefined}>
            <div className="flex items-center gap-3">
              <Avatar name={item.user.name} color={item.user.color} you={item.isMine} size="sm" />
              <p className="min-w-0 flex-1">
                <b>{item.isMine ? 'You' : item.user.name}</b>
                <span className="ml-[6px] text-[13px] text-ink-mute">{timeAgo(item.createdAt)}</span>
              </p>
              <button
                type="button"
                aria-pressed={item.hearts.byMe}
                aria-label={item.hearts.byMe ? 'Remove heart' : 'Send a heart'}
                onClick={() => toggleHeart(item.id)}
                className={
                  item.hearts.byMe
                    ? 'tnum inline-flex items-center gap-[6px] rounded-full border border-ink bg-rose py-[5px] pl-[9px] pr-3 text-[13px] font-bold text-rose-ink shadow-sh1'
                    : 'tnum inline-flex items-center gap-[6px] rounded-full border border-ink bg-card py-[5px] pl-[9px] pr-3 text-[13px] font-bold shadow-sh1'
                }
              >
                <HeartIcon size={16} />
                {item.hearts.count || ''}
              </button>
            </div>
            {item.note && <p className="mt-2">{item.note}</p>}
            {item.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {item.tags.map((t) => (
                  <TagChip key={t.id} name={t.name} />
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={() => run(() => checkIn({ groupId, note: 'Kitchen sink check-in.', tags: ['test'] }), 'You’re in.')}
        >
          Check in here
        </Button>
        <Button size="sm" onClick={() => simulateArrival(groupId) || toast('Everyone’s in already')}>
          Simulate an arrival
        </Button>
      </div>
      <p className="text-[12.5px] text-ink-mute">
        Live simulation is {SIMULATE_LIVE ? 'on: someone arrives every 9–16 seconds' : 'off in this build'}.
      </p>
    </div>
  )
}
