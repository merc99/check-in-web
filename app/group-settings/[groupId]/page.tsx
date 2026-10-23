'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ProfileSheet } from '@/components/feed/ProfileSheet'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TagChip } from '@/components/ui/Chip'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { Input } from '@/components/ui/FormField'
import { IconButton } from '@/components/ui/IconButton'
import { CheckIcon, ShareIcon, XIcon } from '@/components/ui/icons'
import { List, listRow } from '@/components/ui/List'
import { PageHead, SectionTitle } from '@/components/ui/SectionTitle'
import { Swatches } from '@/components/ui/Swatches'
import { BackLink, TextButton } from '@/components/ui/TextButton'
import { CodeTiles, Ticket } from '@/components/ui/Ticket'
import { useToast } from '@/components/ui/Toast'
import { useActiveCrew } from '@/lib/activeCrew'
import { cn } from '@/lib/cn'
import { GROUP_COLORS } from '@/lib/colors'
import { deleteGroup, getGroup, leaveGroup, removeMember, updateGroup, useQuery, type MemberRow } from '@/lib/data'

type Confirm = { kind: 'remove'; member: MemberRow } | { kind: 'delete' } | { kind: 'leave' } | null

export default function GroupSettingsPage({ params }: { params: { groupId: string } }) {
  const { groupId } = params
  const router = useRouter()
  const toast = useToast()
  const { setActiveId } = useActiveCrew()
  const group = useQuery(() => getGroup(groupId), [groupId], ['groups', 'group_members', 'check_ins', 'tags', 'profiles'])
  const [name, setName] = useState('')
  const [wave, setWave] = useState(0)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  // Kept after the sheet closes so the title doesn't change while it slides away.
  const [removing, setRemoving] = useState<MemberRow | null>(null)
  const g = group.data

  // Opening a crew's settings makes it the crew on screen, like the prototype.
  useEffect(() => {
    if (g) setActiveId(g.id)
  }, [g?.id]) // eslint-disable-line react-hooks/exhaustive-deps -- only when the crew changes

  useEffect(() => {
    if (g) setName(g.name)
  }, [g?.name]) // eslint-disable-line react-hooks/exhaustive-deps -- reset the field when the saved name changes

  const fail = (e: unknown) => toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.')

  if (group.error) {
    return (
      <main className="px-5 pb-12">
        <BackLink href="/feed" label="Feed" />
        <div className="px-2 py-10 text-center">
          <h1 className="font-display text-[26px] leading-none">This crew isn’t one of yours.</h1>
          <p className="mt-2 text-ink-soft">It may have been deleted, or you left it.</p>
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
    updateGroup(g.id, { name }).then(() => toast('Crew renamed'), fail)
  }

  const runConfirm = async () => {
    if (!confirm) return
    try {
      if (confirm.kind === 'remove') {
        await removeMember(g.id, confirm.member.person.id)
        setConfirm(null)
        toast('Member removed')
      } else if (confirm.kind === 'delete') {
        await deleteGroup(g.id)
        router.push('/feed')
        toast('Crew deleted')
      } else {
        await leaveGroup(g.id)
        router.push('/feed')
        toast('You left the crew')
      }
    } catch (e) {
      fail(e)
    }
  }

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
          <SectionTitle title="Theme color" />
          <Swatches colors={GROUP_COLORS} value={g.color} onChange={(color) => updateGroup(g.id, { color }).catch(fail)} />

          <SectionTitle title="Crew name" />
          <form
            className="flex items-center gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              rename()
            }}
          >
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={32} aria-label="Crew name" className="min-w-0 flex-1" />
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
                className="rounded-full transition-transform duration-200 ease-spring hover:scale-[1.06]"
              >
                <Avatar name={m.person.name} color={m.person.color} photoUrl={m.person.photoUrl} size="sm" />
              </button>
            )}
            <span className="min-w-0 flex-1">
              <b>{m.isMe ? 'You' : m.person.name}</b>
              {m.isCreator && <span className="text-xs text-ink-mute"> started this crew</span>}
              <br />
              <span className={cn('inline-flex items-center gap-1 text-[12.5px]', m.inToday ? 'font-bold text-leaf-ink' : 'font-medium text-ink-mute')}>
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
              <IconButton size="sm" aria-label={`Remove ${m.person.name}`} onClick={() => {
                  setRemoving(m)
                  setConfirm({ kind: 'remove', member: m })
                }}
              >
                <XIcon size={15} />
              </IconButton>
            )}
          </div>
        ))}
      </List>

      <SectionTitle title="Tags" />
      <Card>
        <div className="flex flex-wrap gap-2">
          {g.tags.length ? g.tags.map((t) => <TagChip key={t.id} name={t.name} />) : <span className="text-[12.5px] text-ink-mute">No tags yet.</span>}
        </div>
        <Button size="sm" className="mt-4" onClick={() => router.push(`/manage-tags/${g.id}`)}>
          Manage tags
        </Button>
      </Card>

      <div className="mt-12 text-center">
        {g.isOwner ? (
          <Button variant="danger" onClick={() => setConfirm({ kind: 'delete' })}>
            Delete crew
          </Button>
        ) : (
          <Button onClick={() => setConfirm({ kind: 'leave' })}>Leave crew</Button>
        )}
      </div>

      <ConfirmSheet
        open={confirm?.kind === 'remove'}
        onClose={() => setConfirm(null)}
        title={`Remove ${removing?.person.name ?? ''}?`}
        body={`They’ll leave ${g.name}. Their check-ins stay part of the crew’s history.`}
        confirmLabel="Remove"
        onConfirm={runConfirm}
      />
      <ConfirmSheet
        open={confirm?.kind === 'delete'}
        onClose={() => setConfirm(null)}
        title="Delete this crew?"
        body="Everyone loses access to the feed. Check-in counts stay on each person’s profile."
        confirmLabel="Delete crew"
        onConfirm={runConfirm}
      />
      <ConfirmSheet
        open={confirm?.kind === 'leave'}
        onClose={() => setConfirm(null)}
        title="Leave this crew?"
        body="You can rejoin later with the invite code."
        confirmLabel="Leave crew"
        onConfirm={runConfirm}
      />
      <ProfileSheet userId={profileId} onClose={() => setProfileId(null)} />
    </main>
  )
}
