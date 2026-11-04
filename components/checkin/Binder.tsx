'use client'

import { BadgeCheck, Pin, PinOff, Share2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Binder as BinderData, BinderCard } from '@/lib/data'
import { tierOf } from '@/lib/mastery'
import { cn } from '@/lib/utils'
import { TierCard } from './TierCard'
import styles from './Binder.module.css'

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

/**
 * A collector's binder (mastery): every tier card someone has earned, the pinned one first, then the
 * next tier in each skill as a locked slot. Tap a card to flip it and see its history. On your own,
 * the back offers Pin and Share.
 */
export function Binder({
  binder, onPin, onShare, compact,
}: { binder: BinderData; onPin?: (groupId: string | null) => void; onShare?: (card: BinderCard) => void; compact?: boolean }) {
  const [flipped, setFlipped] = useState<string | null>(null)
  const cards = compact ? binder.cards.slice(0, 4) : binder.cards
  if (!cards.length && !binder.next.length) return null
  return (
    <div className={cn('grid grid-cols-2 gap-3', !compact && 'sm:grid-cols-3')}>
      {cards.map((c, i) => {
        const key = `${c.groupId}-${c.tier}`
        const pinned = binder.pinnedGroupId === c.groupId && i === 0
        return (
          <div key={key}>
            {pinned && <p className="mb-1 flex items-center gap-1 text-[12px] font-semibold text-muted-foreground"><Pin size={12} aria-hidden="true" /> Pinned</p>}
            <FlipCard
              card={c}
              back={flipped === key}
              onFlip={() => setFlipped((f) => (f === key ? null : key))}
              isMe={binder.isMe}
              pinned={binder.pinnedGroupId === c.groupId}
              onPin={onPin}
              onShare={onShare}
            />
          </div>
        )
      })}
      {!compact &&
        binder.next.map((n) => (
          <div key={`next-${n.groupId}`} className="relative">
            <TierCard tier={n.tier} skill={n.skill} crewName={n.crewName} color={n.color} sessions={0} locked portrait />
            <span className="tnum absolute inset-x-0 bottom-3 text-center text-[12px] font-semibold text-muted-foreground">
              {n.tier === 'master' ? 'No. 0001 unclaimed' : `${n.toGo} to go`}
            </span>
          </div>
        ))}
    </div>
  )
}

function FlipCard({
  card: c, back, onFlip, isMe, pinned, onPin, onShare,
}: {
  card: BinderCard
  back: boolean
  onFlip: () => void
  isMe: boolean
  pinned: boolean
  onPin?: (groupId: string | null) => void
  onShare?: (card: BinderCard) => void
}) {
  const t = tierOf(c.tier)
  return (
    <div className={styles.flip} data-back={back ? '' : undefined}>
      <div className={styles.inner}>
        <button
          type="button"
          className={cn(styles.front, 'block w-full rounded-lg text-left')}
          onClick={onFlip}
          aria-expanded={back}
          aria-label={`${t.name} in ${c.crewName}. Flip for its history.`}
          tabIndex={back ? -1 : 0}
        >
          <TierCard
            tier={c.tier}
            skill={c.skill}
            crewName={c.crewName}
            color={c.color}
            sessions={t.at}
            serial={c.serial}
            verified={c.vouches?.verified}
            portrait
          />
        </button>
        <div className={styles.back} aria-hidden={!back} inert={!back}>
          <dl className="flex flex-col gap-1 text-[12px] leading-tight">
            {[
              ['First session', day(c.firstSessionAt)],
              [`Reached ${t.name}`, day(c.reachedAt)],
              ['Best month', `${c.bestMonth} sessions`],
              ['How rare', `${c.rarity < 1 ? 'Under 1' : c.rarity}% get here`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="tnum text-[13px] font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          {c.vouches?.verified && (
            <p className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary-ink">
              <BadgeCheck size={13} aria-hidden="true" /> Verified
            </p>
          )}
          <div className="mt-auto flex items-center gap-1">
            {isMe && onPin && (
              <Button size="icon" variant="ghost" className="size-9" aria-label={pinned ? 'Unpin' : 'Pin to front'} title={pinned ? 'Unpin' : 'Pin to front'} onClick={() => onPin(pinned ? null : c.groupId)}>
                {pinned ? <PinOff size={15} /> : <Pin size={15} />}
              </Button>
            )}
            {isMe && onShare && (
              <Button size="icon" variant="ghost" className="size-9" aria-label="Share card" title="Share card" onClick={() => onShare(c)}>
                <Share2 size={15} />
              </Button>
            )}
            <Button size="sm" variant="ghost" className="ml-auto h-9 px-3" onClick={onFlip}>
              Flip
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
