'use client'

import { Check, Lock, Palette } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '@/components/checkin/Avatar'
import { PostCard } from '@/components/checkin/PostCard'
import { BadgeDisc, cardFinish } from '@/components/checkin/Progression'
import { ResponsiveSheet } from '@/components/checkin/ResponsiveSheet'
import { Segmented } from '@/components/checkin/Segmented'
import { useToast } from '@/components/checkin/Toast'
import { Button } from '@/components/ui/button'
import { setLoadout, type FeedItem, type MyProgress, type Person } from '@/lib/data'
import { localDate } from '@/lib/dates'
import { SLOT_LABEL, type CardFinish, type FrameKey, type Loadout, type Slot } from '@/lib/progression'
import { HUE_CLASS } from '@/lib/colors'
import { cn } from '@/lib/utils'

/** A post as your crew will see it, wearing what you've picked. */
function previewItem(person: Person, p: MyProgress, loadout: Loadout): FeedItem {
  const now = new Date()
  return {
    id: 'preview', groupId: 'preview', user: person, isMine: true,
    note: 'This is how your check-ins look in the feed.', tags: [], createdAt: new Date(now.getTime() - 2 * 3600e3).toISOString(),
    localDate: localDate(now), hearts: { count: 0, byMe: false, people: [] }, reactions: [], details: null, source: 'manual',
    skill: 'other', milestone: null, photoUrl: null, with: [],
    flex: {
      level: p.level, rank: p.rank, frame: loadout.frame, card: loadout.card,
      badge: loadout.badge ? (p.badges.find((b) => b.key === loadout.badge) ?? null) : null,
    },
  }
}

/**
 * Your check-in card (progression): the post your crew sees, with your finish and frame on it, and "Change your look" to pick from what you've earned.
 */
export function YourCard({ person, progress, className }: { person: Person; progress: MyProgress; className?: string }) {
  const [open, setOpen] = useState(false)
  const earned = progress.rewards.filter((r) => r.unlocked).length + progress.badges.filter((b) => b.unlocked).length
  return (
    <section aria-label="Your check-in card" className={cn('flex flex-col rounded-xl border bg-card p-5 edge-lit', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-medium">Your check-in card</h2>
        <span className="font-mono text-[12px] text-muted-foreground">
          <span className="tnum">{earned}</span> rewards earned
        </span>
      </div>
      <div className="pointer-events-none mt-3 flex-1" aria-hidden="true">
        <PostCard item={previewItem(person, progress, progress.loadout)} onHeart={() => {}} />
      </div>
      <Button variant="secondary" className="mt-4 self-start" onClick={() => setOpen(true)}>
        <Palette size={16} /> Change your look
      </Button>
      <LoadoutSheet open={open} onOpenChange={setOpen} person={person} progress={progress} />
    </section>
  )
}

const SLOTS: { value: Slot; label: string }[] = (['card', 'frame', 'badge'] as const).map((v) => ({ value: v, label: SLOT_LABEL[v] }))

export function LoadoutSheet({
  open, onOpenChange, person, progress: p,
}: { open: boolean; onOpenChange: (o: boolean) => void; person: Person; progress: MyProgress }) {
  const toast = useToast()
  const [slot, setSlot] = useState<Slot>('card')
  // Picks show at once; the save follows (and rolls back if it doesn't go through).
  const [draft, setDraft] = useState<Partial<Loadout>>({})
  const loadout = { ...p.loadout, ...draft }
  const pick = (patch: Partial<Loadout>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setLoadout(patch).then(
      () => setDraft((d) => { const n = { ...d }; for (const k of Object.keys(patch)) delete n[k as keyof Loadout]; return n }),
      (e: unknown) => {
        setDraft({})
        toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.')
      },
    )
  }
  const rewards = p.rewards.filter((r) => r.slot === slot)
  const lockedBadges = p.badges.filter((b) => !b.unlocked).length

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} detents={[0.92]} title="Your look" description="Wear what you’ve earned. Your crew sees it on every check-in.">
      <div>
        <div className="pointer-events-none" aria-hidden="true">
          <PostCard item={previewItem(person, p, loadout)} onHeart={() => {}} />
        </div>
        <div className="mt-4">
          <Segmented options={SLOTS} value={slot} onChange={setSlot} label="What to change" />
        </div>

        <div role="tabpanel" aria-label={SLOT_LABEL[slot]} className="mt-4">
          {slot === 'card' && (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Option selected={!loadout.card} onClick={() => pick({ card: null })} name="Plain" how={null}>
                <span className="block h-12 rounded-md border bg-card" />
              </Option>
              {rewards.map((r) => (
                <Option key={r.id} selected={loadout.card === r.value} locked={!r.unlocked} onClick={() => pick({ card: r.value as CardFinish })} name={r.name} how={r.unlocked ? r.blurb : r.how}>
                  <Swatch finish={r.value as CardFinish} person={person} />
                </Option>
              ))}
            </ul>
          )}

          {slot === 'frame' && (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              <Option selected={!loadout.frame} onClick={() => pick({ frame: null })} name="None" how={null} center>
                <Avatar name={person.name} color={person.color} photoUrl={person.photoUrl} frame={null} size="lg" />
              </Option>
              {rewards.map((r) => (
                <Option key={r.id} selected={loadout.frame === r.value} locked={!r.unlocked} onClick={() => pick({ frame: r.value as FrameKey })} name={r.name} how={r.unlocked ? null : r.how} center>
                  <Avatar name={person.name} color={person.color} photoUrl={person.photoUrl} frame={r.value as FrameKey} size="lg" />
                </Option>
              ))}
            </ul>
          )}

          {slot === 'badge' && (
            <>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                <Option selected={!loadout.badge} onClick={() => pick({ badge: null })} name="None" how={null} center>
                  <span className="grid size-11 place-items-center rounded-full border border-dashed border-border-strong" />
                </Option>
                {p.badges.filter((b) => b.unlocked).map((b) => (
                  <Option key={b.key} selected={loadout.badge === b.key} onClick={() => pick({ badge: b.key })} name={b.name} how={b.crewName} center>
                    <BadgeDisc badgeKey={b.key} />
                  </Option>
                ))}
              </ul>
              <p className="mt-3 text-[13px] text-muted-foreground">Your badge shows on your profile, next to your level, when someone taps your name.</p>
              {lockedBadges > 0 && (
                <p className="mt-3 text-[13px] text-muted-foreground">
                  <span className="tnum">{lockedBadges}</span> more to earn. They’re on your badge wall.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </ResponsiveSheet>
  )
}

function Option({
  selected, locked, onClick, name, how, center, children,
}: { selected: boolean; locked?: boolean; onClick: () => void; name: string; how: string | null; center?: boolean; children: React.ReactNode }) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        disabled={locked}
        onClick={onClick}
        className={cn(
          'relative flex h-full w-full flex-col gap-2 rounded-lg border p-2.5 text-left transition-[border-color,transform] duration-150 ease-out',
          center && 'items-center text-center',
          selected ? 'border-foreground' : 'border-border hover:border-border-strong',
          locked ? 'cursor-not-allowed border-dashed' : 'active:scale-[.97]',
        )}
      >
        <span className={cn('block w-full', center && 'grid place-items-center', locked && 'opacity-60')}>{children}</span>
        <span className="block min-w-0">
          <span className="block truncate text-[13px] font-medium leading-tight">{name}</span>
          {how && (
            <span className={cn('mt-0.5 flex items-center gap-1 text-[12px] leading-tight text-muted-foreground', center && 'justify-center')}>
              {locked && <Lock size={11} aria-hidden="true" className="flex-none" />}
              <span className="truncate">{how}</span>
            </span>
          )}
        </span>
        {selected && (
          <span aria-hidden="true" className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-foreground text-background">
            <Check size={12} strokeWidth={2.5} />
          </span>
        )}
      </button>
    </li>
  )
}

function Swatch({ finish, person }: { finish: CardFinish; person: Person }) {
  const f = cardFinish(finish, person.color)
  return (
    <span className={cn('block h-12 rounded-md border bg-card', f.className)} style={f.style}>
      <span className="relative flex h-full items-center gap-1.5 px-2.5">
        <span className={cn('size-4 rounded-full', HUE_CLASS[person.color].solid)} />
        <span className="h-1.5 w-10 rounded-full bg-muted" />
      </span>
    </span>
  )
}
