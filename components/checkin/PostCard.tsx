'use client'

import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { HUE_CLASS } from '@/lib/colors'
import type { FeedItem } from '@/lib/data'
import { HOUR, timeAgo } from '@/lib/dates'
import { prefersReducedMotion } from '@/lib/motion'
import { useNow } from '@/lib/useNow'
import { Avatar } from './Avatar'
import { TagChip } from './Chip'
import { HEART_PATH } from './icons'
import { SheenOnce } from '@/components/fx/loops'
import { SessionDetails } from './SessionDetails'
import { TierCard } from './TierCard'
import { CheerButton } from './CheerButton'
import { BadgeCheck, Share2 } from 'lucide-react'
import { Button as UiButton } from '@/components/ui/button'
import { tierOf } from '@/lib/mastery'
import type { Hue } from '@/lib/colors'

const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_PX = 30

export interface PostCardProps {
  item: FeedItem
  /** Plays the drop-in (new arrival or your fresh post). */
  entering?: boolean
  onHeart: (on: boolean) => void
  onPersonTap?: (id: string) => void
  /** Emoji reactions. They include the heart, so they replace the heart pill. */
  reactions?: ReactNode
  /** The crew this post is in, for a milestone post's tier card. */
  crewName?: string
  crewColor?: Hue
  /** Milestone posts: cheer it, vouch for the tier, share your own card. */
  onCheer?: (on: boolean) => void
  onVouch?: (on: boolean) => void
  onShare?: () => void
}

/** One check-in. Heart pill, who hearted, and double-tap anywhere on the card to heart it. */
export function PostCard({ item, entering, onHeart, onPersonTap, reactions, crewName, crewColor, onCheer, onVouch, onShare }: PostCardProps) {
  const [burst, setBurst] = useState(0)
  const [pop, setPop] = useState(false)
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null)
  const now = useNow()
  const justIn = item.isMine && now - new Date(item.createdAt).getTime() < HOUR

  const celebrate = () => {
    if (!prefersReducedMotion()) setBurst((b) => b + 1)
    setPop(true)
    setTimeout(() => setPop(false), 300)
  }

  const heart = () => {
    const on = !item.hearts.byMe
    onHeart(on)
    if (on) celebrate()
  }

  // Double-tap detection that works for touch and mouse alike. Taps on buttons don't count.
  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('button,a,[role=menu]')) return
    const now = performance.now()
    const prev = lastTap.current
    if (prev && now - prev.t < DOUBLE_TAP_MS && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < DOUBLE_TAP_PX) {
      lastTap.current = null
      if (!item.hearts.byMe) onHeart(true)
      celebrate()
      return
    }
    lastTap.current = { t: now, x: e.clientX, y: e.clientY }
  }

  const avatar = (
    <Avatar name={item.user.name} color={item.user.color} photoUrl={item.user.photoUrl} you={item.isMine} />
  )

  return (
    <article
      onPointerUp={onPointerUp}
      className={cn(
        'relative touch-manipulation select-none rounded-lg border border-border bg-card p-4 shadow-card lg:p-5',
        // Yours carry a faint mint wash, so your own posts are easy to spot in the scroll.
        item.isMine && 'border-primary/30 bg-[linear-gradient(135deg,var(--primary-soft),var(--card)_55%)]',
        // A mouse over a post lifts it a little (the interactive-card spec); touch has no hover.
        'transition-[transform,box-shadow,border-color] duration-150 ease-out',
        '[@media(hover:hover)]:hover:-translate-y-px [@media(hover:hover)]:hover:border-border-strong [@media(hover:hover)]:hover:shadow-raised',
        entering && 'animate-enter',
      )}
    >
      {/* The author's color down the left edge (mint for you), so a scroll of posts isn't one gray. */}
      <span aria-hidden="true" className={cn('absolute bottom-4 left-0 top-4 w-[3px] rounded-r-full', item.isMine ? 'bg-primary' : HUE_CLASS[item.user.color].solid)} />
      <div className="flex items-center gap-3">
        {onPersonTap && !item.isMine ? (
          <button
            type="button"
            onClick={() => onPersonTap(item.user.id)}
            aria-label={`View ${item.user.name}`}
            className="rounded-full transition-transform duration-150 ease-out hover:scale-[1.06]"
          >
            {avatar}
          </button>
        ) : (
          avatar
        )}
        <p className="min-w-0 flex-1">
          <span className="font-bold">{item.isMine ? 'You' : item.user.name}</span>
          <span className="ml-[6px] text-[13px] text-muted-foreground">{timeAgo(item.createdAt, now)}</span>
        </p>
        {justIn && (
          <span className="ml-auto rounded-full bg-primary-soft px-2 text-primary-ink py-[5px] text-[12px] font-bold leading-none shadow-xs">
            Just in
          </span>
        )}
      </div>

      <div className="-mt-1 pl-[52px]">
        {item.note && <p className="text-base leading-[1.45] lg:text-[17px]">{item.note}</p>}
        <SessionDetails details={item.details} skill={item.skill} source={item.source} className={item.note ? 'mt-2' : undefined} />
        {item.tags.length > 0 && (
          <div className="mt-[10px] flex flex-wrap gap-2">
            {item.tags.map((t) => (
              <TagChip key={t.id} name={t.name} />
            ))}
          </div>
        )}
        {/* A milestone post: this session reached a tier. The tier card makes it stand out in the scroll. */}
        {item.milestone && (
          <div className="mt-3">
            <p className="mb-2 text-[13px] font-semibold">
              {item.isMine ? 'You' : item.user.name} reached {tierOf(item.milestone.tier).name}
            </p>
            <TierCard tier={item.milestone.tier} skill={item.skill} crewName={crewName ?? ''} color={crewColor ?? item.user.color} sessions={item.milestone.sessions} />
            <VouchLine milestone={item.milestone} isMine={item.isMine} name={item.user.name} onVouch={onVouch} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              {onCheer && (
                <CheerButton
                  count={item.milestone.cheers.count}
                  byMe={item.milestone.cheers.byMe}
                  people={item.milestone.cheers.people}
                  color={crewColor ?? item.user.color}
                  isMine={item.isMine}
                  onCheer={onCheer}
                />
              )}
              {item.isMine && onShare && (
                <UiButton size="sm" variant="ghost" className="mt-3" onClick={onShare}>
                  <Share2 size={15} /> Share card
                </UiButton>
              )}
            </div>
          </div>
        )}
        {reactions ? (
          // Reactions include the heart as their first emoji, so they replace the heart pill
          // and the who-hearted stack. Double-tap still hearts, through onHeart.
          <div className="mt-3">{reactions}</div>
        ) : (
        <div className="mt-3 flex items-center gap-[10px]">
          <button
            type="button"
            onClick={heart}
            aria-pressed={item.hearts.byMe}
            aria-label={item.hearts.byMe ? 'Remove heart' : 'Send a heart'}
            className={cn(
              'tnum inline-flex items-center gap-[6px] rounded-full border border-border py-[5px] pl-[9px] pr-3 text-[13px] font-bold shadow-xs',
              'transition-[background-color,color,transform,box-shadow] duration-200 active:translate-y-px active:shadow-none',
              item.hearts.byMe ? 'bg-rose-soft text-rose-ink' : 'bg-card',
            )}
          >
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              aria-hidden="true"
              className={cn('transition-transform duration-350 ease-spring', pop && 'rotate-[-10deg] scale-[1.45]')}
            >
              <path
                d={HEART_PATH}
                stroke="currentColor"
                strokeWidth={2}
                strokeLinejoin="round"
                className={item.hearts.byMe ? 'fill-current' : 'fill-none'}
              />
            </svg>
            {item.hearts.count > 0 && item.hearts.count}
          </button>
          {item.hearts.people.length > 0 && (
            <span className="flex" aria-label={`Hearted by ${item.hearts.people.map((p) => p.name).join(', ')}`}>
              {item.hearts.people.map((p, i) => (
                <Avatar key={p.id} name={p.name} color={p.color} photoUrl={p.photoUrl} size="xs" className={i ? 'ml-[-6px]' : undefined} />
              ))}
            </span>
          )}
        </div>
        )}
      </div>

      {/* A card that just arrived gets one pass of the holo sheen (fx/SheenOnce). */}
      {entering && <SheenOnce />}

      {burst > 0 && (
        <span key={burst} aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 animate-burst opacity-0">
          <svg viewBox="0 0 24 24" width={88} height={88}>
            <path d={HEART_PATH} className="fill-rose stroke-foreground" strokeWidth={1.2} />
          </svg>
        </span>
      )}
    </article>
  )
}

/**
 * Under a milestone's tier card (Committed and up): verified, with who vouched; or how many vouches
 * it still needs; or, on a crewmate's, a button to vouch for it.
 */
function VouchLine({
  milestone: m, isMine, name, onVouch,
}: { milestone: NonNullable<FeedItem['milestone']>; isMine: boolean; name: string; onVouch?: (on: boolean) => void }) {
  const v = m.vouches
  if (!v) return null
  const names = v.people.map((p) => p.name)
  if (v.verified) {
    return (
      <p className="mt-2 inline-flex items-center gap-[6px] text-[13px] font-semibold text-primary-ink">
        <BadgeCheck size={16} strokeWidth={2} aria-hidden="true" /> Verified
        <span className="font-normal text-muted-foreground">vouched by {names.slice(0, 3).join(', ')}{names.length > 3 ? ` and ${names.length - 3} more` : ''}</span>
      </p>
    )
  }
  if (isMine) {
    return <p className="mt-2 text-[13px] text-muted-foreground">{2 - v.count} more vouch{2 - v.count === 1 ? '' : 'es'} from your crew to verify it.</p>
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
      {v.byMe ? (
        <span className="inline-flex items-center gap-[6px] font-semibold text-primary-ink">
          <BadgeCheck size={16} strokeWidth={2} aria-hidden="true" /> You vouched
        </span>
      ) : (
        onVouch && (
          <UiButton size="sm" variant="secondary" onClick={() => onVouch(true)}>
            <BadgeCheck size={15} /> Vouch for {name}
          </UiButton>
        )
      )}
      <span>{v.count ? `${v.count} of 2 vouches` : 'Two vouches verify it'}</span>
    </div>
  )
}
