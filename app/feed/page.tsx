'use client'

import { useRouter } from 'next/navigation'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { CheckInSheet, type CheckInDraft } from '@/components/feed/CheckInSheet'
import { CrewSwitcherSheet } from '@/components/feed/CrewSwitcherSheet'
import { Fab } from '@/components/feed/Fab'
import { FeedHeader } from '@/components/feed/FeedHeader'
import { JoinRequestCard } from '@/components/feed/JoinRequestCard'
import { ProfileSheet } from '@/components/feed/ProfileSheet'
import { Avatar } from '@/components/checkin/Avatar'
import { BrandMark } from '@/components/checkin/BrandMark'
import { Button } from '@/components/checkin/Button'
import { CrewHero } from '@/components/checkin/CrewHero'
import { PinIcon } from '@/components/checkin/icons'
import { JoyTakeover } from '@/components/checkin/JoyTakeover'
import { useLive } from '@/components/checkin/LivePill'
import { PostCard } from '@/components/checkin/PostCard'
import { useToast } from '@/components/checkin/Toast'
import { useActiveCrew } from '@/lib/activeCrew'
import {
  acceptJoinRequest,
  checkIn,
  declineJoinRequest,
  getFeed,
  getGroup,
  getJoinRequests,
  getMe,
  getMyStats,
  onCheckIn,
  onHeart,
  toggleHeart,
  useQuery,
  type FeedItem,
} from '@/lib/data'
import { dayLabel } from '@/lib/dates'
import { prefersReducedMotion } from '@/lib/motion'

const ARRIVAL_MS = 900

interface Joy {
  origin: { x: number; y: number }
  count: number
  sub: string
  item: FeedItem
}

export default function FeedPage() {
  const router = useRouter()
  const toast = useToast()
  const live = useLive()
  const { activeId, setActiveId, groups, loading } = useActiveCrew()

  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [entering, setEntering] = useState<ReadonlySet<string>>(() => new Set())
  const [arrivedId, setArrivedId] = useState<string | null>(null)
  const [joy, setJoy] = useState<Joy | null>(null)
  const joyOpen = useRef(false)
  const fab = useRef<HTMLButtonElement>(null)

  const group = useQuery(() => (activeId ? getGroup(activeId) : Promise.resolve(null)), [activeId], ['groups', 'group_members', 'check_ins', 'tags', 'profiles'])
  const feed = useQuery(() => (activeId ? getFeed(activeId) : Promise.resolve([])), [activeId], ['check_ins', 'reactions', 'tags', 'profiles'])
  const requests = useQuery(() => (activeId ? getJoinRequests(activeId) : Promise.resolve([])), [activeId], ['join_requests', 'group_members'])
  const stats = useQuery(getMyStats, [], ['check_ins'])
  const me = useQuery(getMe, [], ['profiles'])

  /** Drop-in animation for a card, and the sticker pop for its author. */
  const arrive = useCallback((item: FeedItem) => {
    setEntering((s) => new Set(s).add(item.id))
    setArrivedId(item.user.id)
    setTimeout(() => {
      setArrivedId((id) => (id === item.user.id ? null : id))
      setEntering((s) => {
        const next = new Set(s)
        next.delete(item.id)
        return next
      })
    }, ARRIVAL_MS)
  }, [])

  // Live arrivals and hearts (from the live simulation; realtime events with a real backend).
  useEffect(() => {
    if (!activeId) return
    const scrollTop = () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    const offArrivals = onCheckIn(null, (item) => {
      if (item.isMine) return
      const name = <b>{item.user.name}</b>
      if (item.groupId === activeId && !joyOpen.current) {
        arrive(item)
        live({ user: item.user, message: <>{name} just checked in</>, onTap: scrollTop })
      } else {
        const crew = groups?.find((g) => g.id === item.groupId)?.name ?? 'your crew'
        live({
          user: item.user,
          message: <>{name} checked in to {crew}</>,
          onTap: () => {
            setActiveId(item.groupId)
            scrollTop()
          },
        })
      }
    })
    const offHearts = onHeart(({ person }) => live({ user: person, message: <><b>{person.name}</b> sent you a heart</> }))
    return () => {
      offArrivals()
      offHearts()
    }
  }, [activeId, groups, live, setActiveId, arrive])

  // While switching crews, keep the previous crew on screen until the new one loads.
  const g = activeId ? (group.data ?? null) : null
  const meIn = !!g?.members.find((m) => m.isMe)?.inToday

  const openCheckIn = () => {
    if (meIn) toast('You’re in for today')
    else setCheckInOpen(true)
  }

  const submit = async (draft: CheckInDraft) => {
    if (!g) return
    const firstToday = !stats.data?.checkedInToday
    try {
      const item = await checkIn({ groupId: g.id, note: draft.note, tags: draft.tags })
      const after = await getMyStats()
      setCheckInOpen(false)
      const r = fab.current?.getBoundingClientRect()
      joyOpen.current = true
      setJoy({
        origin: r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        count: after.total,
        sub: firstToday && after.streak === 7 ? 'Week one unlocked. Seven days in a row.' : 'That one’s yours for good.',
        item,
      })
    } catch (e) {
      setCheckInOpen(false)
      toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.')
    }
  }

  const act = (fn: () => Promise<unknown>, done: string) =>
    fn().then(
      () => toast(done),
      (e: unknown) => toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.'),
    )

  if (activeId && !g && group.error) {
    return (
      <main className="px-5 pb-[150px]">
        <div className="pb-5 pt-7">
          <BrandMark />
        </div>
        <div className="px-2 py-10 text-center">
          <h2 className="font-display text-[26px] leading-none">Can’t reach your crew right now.</h2>
          <p className="mt-2 text-ink-soft">Nothing’s lost. Give it a moment and try again.</p>
          <Button size="sm" className="mt-5" onClick={group.refetch}>
            Try again
          </Button>
        </div>
      </main>
    )
  }
  if (loading || (activeId && !g)) return <main className="min-h-dvh px-5" />

  if (!g) {
    return (
      <main className="px-5 pb-[150px]">
        <div className="pb-5 pt-7">
          <BrandMark />
        </div>
        <div className="px-2 py-10 text-center">
          <div className="mb-6 flex justify-center">
            <Avatar size="lg" pending />
            <Avatar size="lg" pending className="-ml-2" />
            {me.data && <Avatar size="lg" name={me.data.person.name} color={me.data.person.color} photoUrl={me.data.person.photoUrl} you className="-ml-2" />}
          </div>
          <h2 className="font-display text-[30px] leading-none">Find your crew.</h2>
          <p className="mx-auto mb-6 mt-3 max-w-[32ch] text-ink-soft">
            Check-ins live inside a small group. Start one with friends, or join one that’s already going.
          </p>
          <div className="mx-auto flex max-w-[320px] flex-col gap-4">
            <Button variant="primary" block onClick={() => router.push('/new-group')}>
              Start or join a crew
            </Button>
            <Button block onClick={() => router.push('/explore')}>
              Browse public crews
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const items = feed.data ?? []
  let lastDay = ''

  return (
    <main className="px-5 pb-[150px]">
      <FeedHeader group={g} onSwitch={() => setSwitcherOpen(true)} />

      {requests.data?.map((r) => (
        <JoinRequestCard
          key={r.id}
          request={r}
          onPersonTap={setProfileId}
          onAccept={() => act(() => acceptJoinRequest(r.id), `${r.person.name} joined the crew`)}
          onDecline={() => act(() => declineJoinRequest(r.id), 'Request declined')}
        />
      ))}

      <CrewHero key={g.id} color={g.color} members={g.members} arrivedId={arrivedId} onPersonTap={setProfileId} />

      {g.pinnedMessage && (
        <div className="mt-4 flex items-start gap-[10px] rounded-input border border-dashed border-ink-mute px-[14px] py-3 text-sm text-ink-soft">
          <PinIcon size={17} className="mt-px flex-none" />
          <p>{g.pinnedMessage}</p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="px-2 py-10 text-center">
          <h2 className="font-display text-[26px] leading-none">Quiet so far.</h2>
          <p className="mt-2 text-ink-soft">Be the first one in today.</p>
        </div>
      ) : (
        items.map((item) => {
          const label = dayLabel(item.localDate)
          const divider = label !== lastDay
          lastDay = label
          return (
            <Fragment key={item.id}>
              {divider && (
                <h2 className="mb-[14px] mt-8 flex items-center gap-3 font-display text-[15px] leading-none after:h-[1.5px] after:flex-1 after:bg-rule">
                  {label}
                </h2>
              )}
              <div className={divider ? undefined : 'mt-[14px]'}>
                <PostCard
                  item={item}
                  entering={entering.has(item.id)}
                  onHeart={() => toggleHeart(item.id)}
                  onPersonTap={setProfileId}
                />
              </div>
            </Fragment>
          )
        })
      )}

      <Fab ref={fab} done={meIn} onClick={openCheckIn} />

      <CheckInSheet
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        group={g}
        tags={g.tags.map((t) => t.name)}
        onSubmit={submit}
      />
      <CrewSwitcherSheet
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        groups={groups ?? []}
        activeId={activeId}
        onPick={(id) => {
          setActiveId(id)
          setSwitcherOpen(false)
          window.scrollTo({ top: 0 })
        }}
      />
      <ProfileSheet userId={profileId} onClose={() => setProfileId(null)} />

      {joy && (
        <JoyTakeover
          origin={joy.origin}
          count={joy.count}
          sub={joy.sub}
          onDismiss={() => {
            joyOpen.current = false
            arrive(joy.item)
          }}
          onClosed={() => setJoy(null)}
        />
      )}
    </main>
  )
}
