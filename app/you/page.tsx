'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { DeleteAccountSheets } from '@/components/you/DeleteAccountSheets'
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
import { TextButton, TextLink } from '@/components/checkin/TextButton'
import { useActiveCrew } from '@/lib/activeCrew'
import { useAuth } from '@/lib/auth'
import { getAchievements, getMe, getMyRecentCheckIns, getMyStats, useQuery } from '@/lib/data'
import { localDate, timeAgo } from '@/lib/dates'

export default function YouPage() {
  const router = useRouter()
  const auth = useAuth()
  const { groups } = useActiveCrew()
  const [deleting, setDeleting] = useState(false)
  const me = useQuery(getMe, [], ['profiles'])
  const stats = useQuery(getMyStats, [], ['check_ins'])
  const achievements = useQuery(getAchievements, [], ['check_ins', 'groups', 'group_members'])
  const recent = useQuery(() => getMyRecentCheckIns(3), [], ['check_ins', 'tags', 'groups'])

  const week = useMemo(() => {
    const days = new Set(stats.data?.days)
    return weekDays((d) => days.has(localDate(d)))
  }, [stats.data])

  if (!me.data || !stats.data) return <main className="min-h-dvh px-5" />
  const { profile, person } = me.data
  const unlocked = achievements.data?.filter((a) => a.unlocked).length ?? 0

  return (
    <main className="px-5 pb-[150px]">
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

      <StatsGrid stats={stats.data} />

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
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-3 pt-[6px]">
            {achievements.data.map((a, i) => (
              <AchievementCard key={a.key} achievement={a} tilt={i % 2 ? 'right' : 'left'} />
            ))}
          </div>
        </>
      )}

      <SectionTitle title="Your crews" />
      <List>
        {groups?.map((g) => (
          <div key={g.id} className={listRow}>
            <CrewBlock name={g.name} color={g.color} size="list" />
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

      <div className="mt-10 flex flex-col items-center gap-4">
        <Button block onClick={() => auth.signOut()}>
          Sign out
        </Button>
        <TextButton danger onClick={() => setDeleting(true)}>
          Delete account
        </TextButton>
      </div>

      <DeleteAccountSheets open={deleting} onClose={() => setDeleting(false)} />
    </main>
  )
}
