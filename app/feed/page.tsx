'use client'

import { useRouter } from 'next/navigation'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckInSheet, type CheckInDraft } from '@/components/feed/CheckInSheet'
import { CrewSwitcherSheet } from '@/components/feed/CrewSwitcherSheet'
import { Fab } from '@/components/feed/Fab'
import { FeedHeader } from '@/components/feed/FeedHeader'
import { TodayStrip } from '@/components/feed/TodayStrip'
import { JoinRequestCard } from '@/components/feed/JoinRequestCard'
import { ProfileSheet } from '@/components/feed/ProfileSheet'
import { Avatar } from '@/components/checkin/Avatar'
import { BrandMark } from '@/components/checkin/BrandMark'
import { Button } from '@/components/checkin/Button'
import { Card } from '@/components/checkin/Card'
import { CrewHero } from '@/components/checkin/CrewHero'
import { HeatmapGrid, weekDays } from '@/components/checkin/HeatmapGrid'
import { CheckIcon, PinIcon } from '@/components/checkin/icons'
import { useLive } from '@/components/checkin/LivePill'
import { PostCard } from '@/components/checkin/PostCard'
import { Reactions } from '@/components/checkin/Reactions'
import { useToast } from '@/components/checkin/Toast'
import { useActiveCrew } from '@/lib/activeCrew'
import {
  acceptJoinRequest,
  checkIn,
  declineJoinRequest,
  getAchievements,
  getFeed,
  getGroup,
  getJoinRequests,
  getMe,
  getMyStats,
  getMySkills,
  getMasterCount,
  cheer,
  vouch,
  onCheckIn,
  onHeart,
  react,
  useQuery,
  waveAt,
  type Achievement,
  type FeedItem,
} from '@/lib/data'
import { dayLabel, localDate } from '@/lib/dates'
import { prefersReducedMotion } from '@/lib/motion'
import { HEART } from '@/lib/reactions'
import { tierOf, type TierKey } from '@/lib/mastery'
import { shareCard } from '@/lib/shareCard'
import { useDesktop } from '@/lib/viewport'
import { cn } from '@/lib/utils'
import { HUE_CLASS } from '@/lib/colors'
import { burstFrom } from '@/components/fx/burst'
import { flyArc } from '@/components/fx/fly'
import { RevealCard } from '@/components/fx/RevealCard'
import { TierCeremony, type CeremonyProps } from '@/components/fx/TierCeremony'
import { RollingCount } from '@/components/fx/RollingCount'
import { sfx } from '@/components/fx/sound'

const ARRIVAL_MS = 900

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
  const [milestone, setMilestone] = useState<Achievement | null>(null)
  const [ceremony, setCeremony] = useState<Omit<CeremonyProps, 'onClose' | 'onShare'> | null>(null)
  /** Crewmates you've waved at today, as `crewId:userId`. */
  const [waved, setWaved] = useState<ReadonlySet<string>>(() => new Set())
  const fab = useRef<HTMLButtonElement>(null)
  const railButton = useRef<HTMLButtonElement>(null)
  const desktop = useDesktop()

  const group = useQuery(() => (activeId ? getGroup(activeId) : Promise.resolve(null)), [activeId], ['groups', 'group_members', 'check_ins', 'tags', 'profiles'])
  const feed = useQuery(() => (activeId ? getFeed(activeId) : Promise.resolve([])), [activeId], ['check_ins', 'reactions', 'tags', 'profiles', 'cheers', 'vouches'])
  const requests = useQuery(() => (activeId ? getJoinRequests(activeId) : Promise.resolve([])), [activeId], ['join_requests', 'group_members'])
  const stats = useQuery(getMyStats, [], ['check_ins'])
  const achievements = useQuery(getAchievements, [], ['check_ins', 'groups', 'group_members'])
  const me = useQuery(getMe, [], ['profiles'])

  const week = useMemo(() => {
    const days = new Set(stats.data?.days)
    return weekDays((d) => days.has(localDate(d)))
  }, [stats.data])

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
      if (item.groupId === activeId) {
        arrive(item)
        // A small burst from their sticker in the hero: live crew activity, the one unprompted motion.
        requestAnimationFrame(() => {
          const sticker = document.querySelector(`[data-person="${item.user.id}"]`)
          if (sticker) burstFrom(sticker, [`--${item.user.color}`, 'white', '--primary'], 22)
        })
        const tier = item.milestone ? tierOf(item.milestone.tier).name : null
        live({ user: item.user, message: tier ? <>{name} reached {tier}</> : <>{name} just checked in</>, onTap: scrollTop })
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
    const offHearts = onHeart(({ person, emoji }) =>
      live({ user: person, message: emoji === HEART ? <><b>{person.name}</b> sent you a heart</> : <><b>{person.name}</b> reacted {emoji}</> }),
    )
    return () => {
      offArrivals()
      offHearts()
    }
  }, [activeId, groups, live, setActiveId, arrive])

  // While switching crews, keep the previous crew on screen until the new one loads.
  const g = activeId ? (group.data ?? null) : null
  const meIn = !!g?.members.find((m) => m.isMe)?.inToday

  // Wave at a crewmate who isn't in yet: once a day, no pressure (the live demo sometimes answers).
  const wave = (id: string) => {
    if (!g) return
    const name = g.members.find((m) => m.person.id === id)?.person.name ?? 'them'
    const key = `${g.id}:${id}`
    waveAt(g.id, id).then(
      (r) => {
        setWaved((s) => new Set(s).add(key))
        toast(r === 'sent' ? `You waved at ${name}. No pressure.` : `You already waved at ${name} today.`)
      },
      (e: unknown) => toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.'),
    )
  }
  const isWaved = (id: string) => !!g && waved.has(`${g.id}:${id}`)

  // Phones: a swipe on the banner moves along your crews (wrapping round).
  const crewIndex = groups?.findIndex((x) => x.id === g?.id) ?? -1
  const swipeCrew = (dir: 1 | -1) => {
    if (!groups?.length || crewIndex < 0) return
    setActiveId(groups[(crewIndex + dir + groups.length) % groups.length].id)
    window.scrollTo({ top: 0 })
  }

  // Mastery: vouch for a crewmate's tier, and share your own tier card as an image.
  const vouchFor = (item: FeedItem, on: boolean) => {
    if (!item.milestone) return
    vouch(item.user.id, item.groupId, item.milestone.tier, on).then(
      () => on && toast(`You vouched for ${item.user.name}’s ${tierOf(item.milestone!.tier).name}.`),
      (e: unknown) => toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.'),
    )
  }
  const share = async ({ tier, sessions, rarity, serial }: { tier: TierKey; sessions: number; rarity?: number; serial?: number | null }) => {
    if (!g || !me.data) return
    try {
      const how = await shareCard({ tier, crewName: g.name, color: g.color, sessions, personName: me.data.person.name, rarity, serial })
      if (how === 'downloaded') toast('Card saved as an image.')
    } catch {
      toast('That card didn’t draw. Try again.')
    }
  }

  const openCheckIn = () => {
    if (meIn) toast('You’re in for today')
    else setCheckInOpen(true)
  }

  const submit = async (draft: CheckInDraft) => {
    if (!g) return
    const firstToday = !stats.data?.checkedInToday
    const unlockedBefore = new Set(achievements.data?.filter((a) => a.unlocked).map((a) => a.key))
    try {
      const item = await checkIn({ groupId: g.id, note: draft.note, tags: draft.tags, details: draft.details, source: draft.source, photoUrl: draft.photoUrl })
      const [after, earned] = await Promise.all([getMyStats(), getAchievements()])
      setCheckInOpen(false)
      // The celebration (fx, D2): a burst from whichever check-in button is on screen
      // (the FAB on phones, the rail button on desktop), in the crew's hue with mint.
      const trigger = [fab.current, railButton.current].find((el) => el && el.getClientRects().length > 0)
      if (trigger) burstFrom(trigger, [`--${g.color}`, '--primary', `--${g.color}`, '--lemon', 'white'])
      sfx('success')
      arrive(item)
      // The day's first check-in moves the streak (fx, E1): +1 lands on it (rail on desktop, You tab on phones).
      const streak = Array.from(document.querySelectorAll('[data-fx-streak]')).find((el) => el.getClientRects().length > 0)
      if (firstToday && trigger && streak) {
        flyArc({ from: trigger, to: streak, text: '+1', className: 'font-display text-[22px] font-extrabold text-primary-ink' })
      }
      // A milestone (fx, F2) gets the reveal card; otherwise one toast says it counted.
      const fresh = earned.find((a) => a.unlocked && !unlockedBefore.has(a.key))
      const tierUp = item.milestone ? tierOf(item.milestone.tier) : null
      if (tierUp && item.milestone) {
        // A tier-up is the bigger moment: the ceremony (fx/TierCeremony), escalating with the tier.
        const [skills, masters] = await Promise.all([getMySkills(), tierUp.key === 'master' ? getMasterCount() : Promise.resolve(0)])
        const sp = skills.find((s) => s.groupId === g.id)
        const c = { tier: tierUp.key, skill: g.skillKind, crewName: g.name, color: g.color, sessions: item.milestone.sessions, rarity: sp?.rarity, serial: tierUp.key === 'master' ? masters : null }
        window.setTimeout(() => setCeremony(c), 700)
      } else if (fresh) window.setTimeout(() => setMilestone(fresh), 700)
      else toast(firstToday && after.streak === 7 ? 'Week one. Seven days in a row.' : 'You showed up. That one’s yours for good.')
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
          <p className="mt-2 text-muted-foreground">Nothing’s lost. Give it a moment and try again.</p>
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
          <p className="mx-auto mb-6 mt-3 max-w-[32ch] text-muted-foreground">
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

  const hero = (
    <CrewHero key={g.id} color={g.color} members={g.members} arrivedId={arrivedId} onPersonTap={setProfileId} onWave={wave} waved={isWaved} recent={g.recent} />
  )

  return (
    // Phones: one column (hero above the posts, FAB for check-in).
    // Desktop: the posts on the left, a sticky rail on the right with check-in, the crew's day and your week.
    <main
      data-layout="wide"
      className="px-5 pb-[150px] lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 lg:px-8 lg:pb-16 xl:grid-cols-[minmax(0,760px)_340px] xl:justify-center xl:gap-10 2xl:grid-cols-[minmax(0,760px)_360px]"
    >
      <div className="min-w-0">
      <FeedHeader
        group={g}
        onSwitch={() => setSwitcherOpen(true)}
        today={
          !desktop && (
            <TodayStrip
              key={g.id}
              color={g.color}
              members={g.members}
              arrivedId={arrivedId}
              onPersonTap={setProfileId}
              onWave={wave}
              waved={isWaved}
              recent={g.recent}
            />
          )
        }
        onSwipe={!desktop && (groups?.length ?? 0) > 1 ? swipeCrew : undefined}
        position={groups && crewIndex >= 0 ? { index: crewIndex, count: groups.length } : undefined}
      />

      {requests.data?.map((r) => (
        <JoinRequestCard
          key={r.id}
          request={r}
          onPersonTap={setProfileId}
          onAccept={() => act(() => acceptJoinRequest(r.id), `${r.person.name} joined the crew`)}
          onDecline={() => act(() => declineJoinRequest(r.id), 'Request declined')}
        />
      ))}

      {g.pinnedMessage && (
        // A note pinned to the crew, in the crew's tint: it reads as a note, not another post.
        <div className={cn('mt-4 flex items-start gap-[10px] rounded-lg px-4 py-3 text-[14.5px] font-medium', HUE_CLASS[g.color].soft, HUE_CLASS[g.color].ink)}>
          <PinIcon size={17} className="mt-[2px] flex-none rotate-[20deg]" />
          <p>{g.pinnedMessage}</p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="px-2 py-10 text-center">
          <h2 className="font-display text-[26px] leading-none">Quiet so far.</h2>
          <p className="mt-2 text-muted-foreground">Be the first one in today.</p>
        </div>
      ) : (
        // One column of posts, always.
        <div className="flex flex-col gap-[14px]">
          {items.map((item, i) => {
            const label = dayLabel(item.localDate)
            const divider = i === 0 || dayLabel(items[i - 1].localDate) !== label
            const first = i === 0
            return (
              <Fragment key={item.id}>
                {divider && (
                  <h2 className={cn('flex items-center gap-3 font-display text-[15px] leading-none after:h-[1.5px] after:flex-1 after:bg-border', first ? 'mt-8' : 'mt-6')}>
                    {label}
                  </h2>
                )}
                <PostCard
                  item={item}
                  entering={entering.has(item.id)}
                  onHeart={(on) => react(item.id, HEART, on)}
                  reactions={<Reactions chips={item.reactions} onReact={(emoji, on) => react(item.id, emoji, on)} />}
                  onPersonTap={setProfileId}
                  crewName={g.name}
                  crewColor={g.color}
                  onCheer={item.milestone ? (on) => cheer(item.id, on).catch(() => toast('That didn’t go through. Try again.')) : undefined}
                  onVouch={item.milestone?.vouches ? (on) => vouchFor(item, on) : undefined}
                  onShare={item.milestone && item.isMine ? () => share({ tier: item.milestone!.tier, sessions: item.milestone!.sessions, rarity: item.milestone!.rarity }) : undefined}
                />
              </Fragment>
            )
          })}
        </div>
      )}
      </div>

      {desktop && (
        <aside aria-label="Today" className="sticky top-0 flex flex-col gap-4 self-start pt-[62px]">
          <Button ref={railButton} variant={meIn ? 'secondary' : 'primary'} block onClick={openCheckIn}>
            <CheckIcon size={18} /> {meIn ? 'You’re in for today' : 'Check in'}
          </Button>
          {hero}
          <Card>
            <div className="mb-[14px] flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[17px] leading-none">Your week</h2>
              {stats.data && <small className="tnum text-[13px] text-muted-foreground">{stats.data.total} all time</small>}
            </div>
            <HeatmapGrid days={week} />
            {stats.data && (
              <p className="mt-3 text-[13px] text-muted-foreground">
                <span data-fx-streak="" className="inline-block font-bold text-foreground">
                  <RollingCount n={stats.data.streak} label={`${stats.data.streak}`} />
                </span>
                -day streak, best <span className="tnum">{stats.data.best}</span>
              </p>
            )}
          </Card>
        </aside>
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

      {milestone && <RevealCard achievement={milestone} onClose={() => setMilestone(null)} />}
      {ceremony && <TierCeremony {...ceremony} onShare={() => share(ceremony)} onClose={() => setCeremony(null)} />}
    </main>
  )
}
