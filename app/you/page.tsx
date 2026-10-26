'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import { ProfileSheet } from '@/components/feed/ProfileSheet'
import { CrewDonut } from '@/components/you/CrewDonut'
import { CrewLeaderboard } from '@/components/you/CrewLeaderboard'
import { StatsGrid } from '@/components/you/StatsGrid'
import { AchievementCard } from '@/components/checkin/AchievementCard'
import { Avatar } from '@/components/checkin/Avatar'
import { Button } from '@/components/checkin/Button'
import { Card } from '@/components/checkin/Card'
import { TagChip } from '@/components/checkin/Chip'
import { CrewBlock, CrewDot } from '@/components/checkin/CrewBlock'
import { HeatmapGrid, weekDays } from '@/components/checkin/HeatmapGrid'
import { IconLink } from '@/components/checkin/IconButton'
import { GearIcon, PlusIcon } from '@/components/checkin/icons'
import { List, listRow } from '@/components/checkin/List'
import { SectionTitle } from '@/components/checkin/SectionTitle'
import { TextLink } from '@/components/checkin/TextButton'
import { Switch } from '@/components/checkin/Switch'
import { ThemeToggle } from '@/components/checkin/theme-toggle'
import { useToast } from '@/components/checkin/Toast'
import { HoldButton } from '@/components/fx/HoldButton'
import { useSound } from '@/components/fx/sound'
import { useActiveCrew } from '@/lib/activeCrew'
import { useAuth } from '@/lib/auth'
import { deleteAccount, getAchievements, getMe, getMyInsights, getMyRecentCheckIns, getMyStats, useQuery } from '@/lib/data'
import { localDate, timeAgo } from '@/lib/dates'
import { useDragScroll } from '@/lib/useDragScroll'

export default function YouPage() {
  const router = useRouter()
  const auth = useAuth()
  const { groups } = useActiveCrew()
  const toast = useToast()
  const { soundOn, setSoundOn } = useSound()
  const me = useQuery(getMe, [], ['profiles'])
  const stats = useQuery(getMyStats, [], ['check_ins'])
  const achievements = useQuery(getAchievements, [], ['check_ins', 'groups', 'group_members'])
  const recent = useQuery(() => getMyRecentCheckIns(3), [], ['check_ins', 'tags', 'groups'])
  const insights = useQuery(getMyInsights, [], ['check_ins', 'groups', 'group_members'])
  const [profileId, setProfileId] = useState<string | null>(null)
  const shelf = useRef<HTMLDivElement>(null)
  useDragScroll(shelf, achievements.data)

  const week = useMemo(() => {
    const days = new Set(stats.data?.days)
    return weekDays((d) => days.has(localDate(d)))
  }, [stats.data])

  const deleteMe = () =>
    deleteAccount().then(
      async () => {
        await auth.signOut() // the auth gate takes them to the intro
        toast('Account deleted')
      },
      (e: unknown) => toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.'),
    )

  if (!me.data || !stats.data) return <main className="min-h-dvh px-5" />
  const { profile, person } = me.data
  const unlocked = achievements.data?.filter((a) => a.unlocked).length ?? 0

  return (
    // Desktop: the wide layout, a dashboard of glossy stat cards and two columns under them.
    <main data-layout="wide" className="px-5 pb-[150px] lg:mx-auto lg:w-full lg:max-w-[1040px] lg:px-8 lg:pb-16">
      <section className="flex items-center gap-5 pb-2 pt-8">
        <Avatar name={person.name} color={person.color} photoUrl={person.photoUrl} size="xl" you className="rotate-[-4deg]" />
        <div className="min-w-0 flex-1">
          <h1 className="wrap-break-word font-display text-4xl leading-[.95]">{person.name}</h1>
          {profile.handle && <p className="mt-[6px] text-muted-foreground">@{profile.handle}</p>}
          {profile.bio && <p className="mt-[6px]">{profile.bio}</p>}
          <Button size="sm" className="mt-3" onClick={() => router.push('/profile/edit')}>
            Edit profile
          </Button>
        </div>
      </section>

      <StatsGrid stats={stats.data} insights={insights.data} />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
      <div className="min-w-0">

      <SectionTitle title="This week" />
      <Card>
        <HeatmapGrid days={week} animate />
        <p className="mt-[14px] text-[12.5px] text-muted-foreground">
          {stats.data.checkedInToday ? 'You’re in for today.' : 'Today’s still open. No rush.'}
        </p>
      </Card>

      {achievements.data && (
        <>
          <SectionTitle
            title="Achievements"
            note={
              <>
                <span className="tnum">{unlocked}</span> of <span className="tnum">{achievements.data.length}</span>
              </>
            }
          />
          {/* Swipe on touch; press and drag with a mouse (useDragScroll). */}
          <div
            ref={shelf}
            className="no-scrollbar -mx-5 flex cursor-grab snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-3 pt-[6px] select-none"
          >
            {achievements.data.map((a, i) => (
              <AchievementCard key={a.key} achievement={a} tilt={i % 2 ? 'right' : 'left'} />
            ))}
          </div>
        </>
      )}

      {recent.data && recent.data.length > 0 && (
        <>
          <SectionTitle title="Recent check-ins" />
          <div className="flex flex-col gap-[10px]">
            {recent.data.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card px-4 py-[14px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-[13px] font-bold">
                    <CrewDot color={c.group.color} />
                    <span className="truncate">{c.group.name}</span>
                  </span>
                  <span className="flex-none text-[12.5px] text-muted-foreground">
                    {timeAgo(c.createdAt) === 'now' ? 'just now' : `${timeAgo(c.createdAt)} ago`}
                  </span>
                </div>
                {c.note && <p className="mt-[6px]">{c.note}</p>}
                {c.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.tags.map((t) => (
                      <TagChip key={t.id} name={t.name} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      </div>

      <div className="min-w-0">
        {insights.data && (
          <>
            <SectionTitle title="Crew streaks" />
            <CrewLeaderboard rows={insights.data.leaderboard} onPersonTap={setProfileId} />
            <SectionTitle title="Where your check-ins go" />
            <CrewDonut crews={insights.data.byCrew} />
          </>
        )}
      <SectionTitle title="Your crews" />
      <List>
        {groups?.map((g) => (
          <div key={g.id} className={listRow}>
            <CrewBlock name={g.name} color={g.color} emoji={g.emoji} size="list" />
            <span className="min-w-0 flex-1">
              <b>{g.name}</b>
              <br />
              <span className="text-[12.5px] text-muted-foreground">
                <span className="tnum">{g.inToday}</span> of <span className="tnum">{g.memberCount}</span> in today
              </span>
            </span>
            <IconLink href={`/group-settings/${g.id}`} label={`${g.name} settings`} size="sm">
              <GearIcon size={16} />
            </IconLink>
          </div>
        ))}
        <div className={listRow}>
          <TextLink href="/new-group" className="py-1 pl-0">
            <PlusIcon size={16} /> Start or join a crew
          </TextLink>
        </div>
      </List>

      </div>
      </div>

      <div className="lg:mx-auto lg:max-w-app">
      <SectionTitle title="Settings" />
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <p className="font-bold">Theme</p>
          <div className="w-[220px]">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex items-center gap-4 border-t pt-4">
          <div className="min-w-0 flex-1">
            <p className="font-bold">Sounds</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Small sounds for check-ins, reactions and milestones.</p>
          </div>
          <Switch checked={soundOn} onChange={setSoundOn} label="Sounds" />
        </div>
      </Card>

      <div className="mx-auto mt-10 flex max-w-[360px] flex-col items-center gap-6">
        <Button block onClick={() => auth.signOut()}>
          Sign out
        </Button>
        {/* Hold to confirm (fx/HoldButton): the hold is the confirmation, the line says what goes. */}
        <HoldButton
          label="Hold to delete account"
          hint="Hold the button to delete your account"
          detail="Your check-ins, crews and profile go away. Your crews keep going without you."
          onConfirm={deleteMe}
        />
      </div>
      </div>

      <ProfileSheet userId={profileId} onClose={() => setProfileId(null)} />
    </main>
  )
}
