'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react';
import { ProfileSheet } from '@/components/feed/ProfileSheet'
import { Avatar } from '@/components/checkin/Avatar'
import { Button } from '@/components/checkin/Button'
import { Card } from '@/components/checkin/Card'
import { TagChip } from '@/components/checkin/Chip'
import { Input } from '@/components/checkin/FormField'
import { HoldButton } from '@/components/fx/HoldButton'
import { CheckIcon, ShareIcon, XIcon } from '@/components/checkin/icons'
import { List, listRow } from '@/components/checkin/List'
import { PageHead, SectionTitle } from '@/components/checkin/SectionTitle'
import { CrewLook } from '@/components/crew/CrewLook'
import { Switch } from '@/components/checkin/Switch'
import { BackLink, TextButton } from '@/components/checkin/TextButton'
import { CodeTiles, Ticket } from '@/components/checkin/Ticket'
import { useToast } from '@/components/checkin/Toast'
import { useActiveCrew } from '@/lib/activeCrew'
import { cn } from '@/lib/utils'
import { SKILL_KINDS, SKILL_LABEL } from '@/lib/mastery'
import { deleteGroup, getGroup, leaveGroup, removeMember, updateGroup, useQuery, type MemberRow } from '@/lib/data'


export default function GroupSettingsPage(props: { params: Promise<{ groupId: string }> }) {
  const params = use(props.params);
  const { groupId } = params
  const router = useRouter()
  const toast = useToast()
  const { setActiveId } = useActiveCrew()
  const group = useQuery(() => getGroup(groupId), [groupId], ['groups', 'group_members', 'check_ins', 'tags', 'profiles'])
  // Your edit to the name, or null to show the saved name.
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [wave, setWave] = useState(0)
  const [profileId, setProfileId] = useState<string | null>(null)
  // Kept after the sheet closes so the title doesn't change while it slides away.
  const g = group.data

  // Opening a crew's settings makes it the crew on screen, like the prototype.
  useEffect(() => {
    if (g) setActiveId(g.id)
  }, [g?.id]) // eslint-disable-line react-hooks/exhaustive-deps -- only when the crew changes

  const name = nameDraft ?? g?.name ?? ''

  const fail = (e: unknown) => toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.')

  if (group.error) {
    return (
      <main className="px-5 pb-12">
        <BackLink href="/feed" label="Feed" />
        <div className="px-2 py-10 text-center">
          <h1 className="font-display text-[26px] leading-none">This crew isn’t one of yours.</h1>
          <p className="mt-2 text-muted-foreground">It may have been deleted, or you left it.</p>
        </div>
      </main>
    )
  }
  if (!g) return <main className="min-h-dvh px-5" />

  const copyCode = () => {
    navigator.clipboard?.writeText(g.slug).catch(() => {})
    setWave((w) => w + 1)
    toast('Invite code copied')
  }

  const share = () => {
    const url = `${window.location.origin}/invite/${g.slug}`
    const text = `Join ${g.name} on Check-in. Code: ${g.slug}`
    if (navigator.share) {
      navigator.share({ title: 'Check-in', text, url }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(`${text} ${url}`).catch(() => {})
      toast('Invite copied')
    }
  }

  const rename = () => {
    if (!name.trim()) return
    updateGroup(g.id, { name }).then(() => {
      setNameDraft(null)
      toast('Crew renamed')
    }, fail)
  }

  // Destructive actions are hold-to-confirm (fx/HoldButton): the hold is the confirmation.
  const remove = (m: MemberRow) =>
    removeMember(g.id, m.person.id).then(() => toast(`${m.person.name} removed`), fail)
  const destroy = () =>
    deleteGroup(g.id).then(() => {
      router.push('/feed')
      toast('Crew deleted')
    }, fail)
  const leave = () =>
    leaveGroup(g.id).then(() => {
      router.push('/feed')
      toast('You left the crew')
    }, fail)

  return (
    <main className="px-5 pb-12">
      <BackLink href="/feed" label="Feed" />
      <PageHead
        className="pt-3"
        title={g.name}
        lead={
          <>
            <span className="tnum">{g.memberCount}</span> of <span className="tnum">{g.maxMembers}</span> members
          </>
        }
      />

      <Ticket
        color={g.color}
        className="mt-5"
        top={
          <div className="px-5 pb-[18px] pt-5">
            <p className="text-sm font-bold">Invite code</p>
            <button type="button" onClick={copyCode} aria-label={`Copy invite code ${g.slug.split('').join(' ')}`} className="mt-3 block rounded-[10px]">
              <CodeTiles code={g.slug} wave={wave} />
            </button>
            <p className="mt-[10px] text-[12.5px] font-medium">Tap the code to copy it.</p>
          </div>
        }
        bottom={
          <div className="flex flex-wrap items-center gap-[10px] px-5 py-[14px]">
            <Button size="sm" onClick={share}>
              <ShareIcon size={16} /> Share invite
            </Button>
            <TextButton onClick={() => router.push(`/invite/${g.slug}`)}>See the invite page</TextButton>
          </div>
        }
      />

      {g.isOwner && (
        <>
          <SectionTitle title="Crew look" note="banner, cards and lists" />
          <CrewLook name={g.name} value={{ color: g.color, emoji: g.emoji, pattern: g.pattern }} onChange={(patch) => updateGroup(g.id, patch).catch(fail)} />

          {/* Mastery: the skill this crew practises decides the check-in details and the tier cards' label. */}
          <SectionTitle title="What the crew practises" />
          <div role="group" aria-label="Skill" className="flex flex-wrap gap-2">
            {SKILL_KINDS.map((k) => {
              const on = g.skillKind === k
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={on}
                  onClick={() => !on && updateGroup(g.id, { skill_kind: k }).then(() => toast(`${g.name} practises ${SKILL_LABEL[k].toLowerCase()}`), fail)}
                  className={cn(
                    'hit-44 inline-flex h-9 items-center rounded-full border px-4 text-[13px] font-semibold transition-colors duration-150 ease-out',
                    on ? 'border-foreground bg-foreground text-background' : 'border-border-strong bg-card hover:bg-muted',
                  )}
                >
                  {SKILL_LABEL[k]}
                </button>
              )
            })}
          </div>

          <SectionTitle title="Who can find it" />
          <Card className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-bold">Show in Explore</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {g.isPublic ? 'Anyone can find this crew and ask to join.' : 'Invite code only. Nobody finds it by browsing.'}
              </p>
            </div>
            <Switch
              label="Show in Explore"
              checked={g.isPublic}
              onChange={(on) =>
                updateGroup(g.id, { is_public: on }).then(() => toast(on ? 'Listed in Explore' : 'Hidden from Explore'), fail)
              }
            />
          </Card>

          <SectionTitle title="Crew name" />
          <form
            className="flex items-center gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              rename()
            }}
          >
            <Input value={name} onChange={(e) => setNameDraft(e.target.value)} maxLength={32} aria-label="Crew name" className="min-w-0 flex-1" />
            <Button type="submit" size="sm" variant="primary" disabled={!name.trim() || name.trim() === g.name}>
              Save
            </Button>
          </form>
        </>
      )}

      <SectionTitle title="Members" note="streak, and today" />
      <List>
        {g.members.map((m) => (
          <div key={m.person.id} className={listRow}>
            {m.isMe ? (
              <Avatar name={m.person.name} color={m.person.color} photoUrl={m.person.photoUrl} size="sm" you />
            ) : (
              <button
                type="button"
                onClick={() => setProfileId(m.person.id)}
                aria-label={`View ${m.person.name}`}
                className="rounded-full transition-transform duration-150 ease-out hover:scale-[1.06]"
              >
                <Avatar name={m.person.name} color={m.person.color} photoUrl={m.person.photoUrl} size="sm" />
              </button>
            )}
            <span className="min-w-0 flex-1">
              <b>{m.isMe ? 'You' : m.person.name}</b>
              {m.isCreator && <span className="text-xs text-muted-foreground"> started this crew</span>}
              <br />
              <span className={cn('inline-flex items-center gap-1 text-[12.5px]', m.inToday ? 'font-bold text-leaf-ink' : 'font-medium text-muted-foreground')}>
                {m.inToday ? (
                  <>
                    <CheckIcon size={13} /> In today
                  </>
                ) : (
                  'Not yet today'
                )}
              </span>
            </span>
            <span className="tnum font-display text-[17px]" aria-label={`${m.streak}-day streak`}>
              {m.streak}
            </span>
            {g.isOwner && !m.isMe && (
              <HoldButton
                variant="icon"
                label={`Hold to remove ${m.person.name}`}
                hint={`Hold the × to remove ${m.person.name}`}
                onConfirm={() => remove(m)}
              >
                <XIcon size={15} />
              </HoldButton>
            )}
          </div>
        ))}
      </List>

      <SectionTitle title="Tags" />
      <Card>
        <div className="flex flex-wrap gap-2">
          {g.tags.length ? g.tags.map((t) => <TagChip key={t.id} name={t.name} />) : <span className="text-[12.5px] text-muted-foreground">No tags yet.</span>}
        </div>
        <Button size="sm" className="mt-4" onClick={() => router.push(`/manage-tags/${g.id}`)}>
          Manage tags
        </Button>
      </Card>

      <div className="mx-auto mt-12 max-w-[360px]">
        {g.isOwner ? (
          <HoldButton
            label="Hold to delete crew"
            hint="Hold the button to delete the crew"
            detail="Everyone loses the feed. Check-in counts stay on each person’s profile."
            onConfirm={destroy}
          />
        ) : (
          <HoldButton
            variant="secondary"
            label="Hold to leave crew"
            hint="Hold the button to leave the crew"
            detail="You can rejoin later with the invite code."
            onConfirm={leave}
          />
        )}
      </div>

      <ProfileSheet userId={profileId} onClose={() => setProfileId(null)} />
    </main>
  )
}
