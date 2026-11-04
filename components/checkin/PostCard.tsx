'use client'

import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { FeedItem } from '@/lib/data'
import { HOUR, timeAgo } from '@/lib/dates'
import { prefersReducedMotion } from '@/lib/motion'
import { useNow } from '@/lib/useNow'
import { Avatar } from './Avatar'
import { TagChip } from './Chip'
import { HEART_PATH } from './icons'
import { SessionDetails } from './SessionDetails'
import { TIER_HUE, TierMedal } from './TierCard'
import { crewTint } from './CrewTint'
import { cardFinish } from './Progression'
import { Share2 } from 'lucide-react'
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
  /** The crew this post is in, for a milestone post's line (crewColor is kept for callers; the card wears the tier's color). */
  crewName?: string
  crewColor?: Hue
  /** Milestone posts: share your own card. */
  onShare?: () => void
}

/** One check-in. Heart pill, who hearted, and double-tap anywhere on the card to heart it. */
export function PostCard({ item, entering, onHeart, onPersonTap, reactions, crewName, onShare }: PostCardProps) {
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

  // A milestone post is the crew's big moment: a matte printed card with an edge in the tier's own
  // color (green for Started, fire for Committed...). The tier
  // shows as one compact line with its coin, not a second card.
  const moment = item.milestone
    ? crewTint(TIER_HUE[item.milestone.tier], ['holo', 'aurora', 'master'].includes(tierOf(item.milestone.tier).material) ? 'holo' : 'glow')
    : null
  // Everyday posts wear the author's earned finish (progression); milestone posts keep the tier's card.
  const finish = !moment && item.flex.card ? cardFinish(item.flex.card, item.user.color) : null
  const flex = item.flex

  const avatar = (
    <Avatar name={item.user.name} color={item.user.color} photoUrl={item.user.photoUrl} you={item.isMine} frame={flex.frame} />
  )

  return (
    <article
      onPointerUp={onPointerUp}
      className={cn(
        'relative touch-manipulation select-none rounded-xl p-4 lg:p-5',
        moment
          ? moment.className
          : // A mouse over a post brightens its edge; touch has no hover.
            'border border-border bg-card edge-lit transition-[border-color] duration-150 ease-out [@media(hover:hover)]:hover:border-border-strong',
        finish?.className,
        entering && 'animate-enter',
      )}
      style={moment?.style ?? finish?.style}
    >
      <div className="flex items-center gap-3">
        {onPersonTap && !item.isMine ? (
          <button
            type="button"
            onClick={() => onPersonTap(item.user.id)}
            aria-label={`View ${item.user.name}`}
            className="hit-44 rounded-full transition-transform duration-150 ease-out active:scale-[.97]"
          >
            {avatar}
          </button>
        ) : (
          avatar
        )}
        <p className="min-w-0 flex-1">
          {onPersonTap && !item.isMine ? (
            // The name opens their profile too (level, rank and showcase badge live there).
            <button type="button" onClick={() => onPersonTap(item.user.id)} className="font-medium underline-offset-4 hover:underline">
              {item.user.name}
            </button>
          ) : (
            <span className="font-medium">{item.isMine ? 'You' : item.user.name}</span>
          )}
          {item.with.length > 0 && (
            <span className="text-muted-foreground">
              {' '}with <span className="font-medium text-foreground">{listNames(item.with.map((p) => p.name))}</span>
            </span>
          )}
          <span className="ml-2 text-[13px] text-muted-foreground">{timeAgo(item.createdAt, now)}</span>
        </p>
        {justIn && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-primary-ink">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
            Just in
          </span>
        )}
      </div>

      <div className="-mt-1 pl-[52px]">
        {item.milestone && (
          <div className="mb-3 mt-2 flex items-center gap-3">
            <TierMedal tier={item.milestone.tier} />
            <div className="min-w-0">
              <p className="text-[17px] font-medium leading-tight tracking-tight">
                {item.isMine ? 'You' : item.user.name} reached {tierOf(item.milestone.tier).name}
              </p>
              <p className="mt-0.5 font-mono text-[12px] text-muted-foreground">
                <span className="tnum">{item.milestone.sessions.toLocaleString()}</span> session{item.milestone.sessions === 1 ? '' : 's'}{crewName ? ` in ${crewName}` : ''}
              </p>
            </div>
          </div>
        )}
        {item.note && <p className="text-[15px] leading-[1.5] lg:text-base">{item.note}</p>}
        <SessionDetails details={item.details} skill={item.skill} source={item.source} className={item.note ? 'mt-2' : undefined} />
        {item.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photoUrl} alt={`${item.isMine ? 'Your' : `${item.user.name}’s`} proof photo`} className="mt-3 max-h-[320px] w-full rounded-md object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10" />
        )}
        {item.tags.length > 0 && (
          <div className="mt-[10px] flex flex-wrap gap-2">
            {item.tags.map((t) => (
              <TagChip key={t.id} name={t.name} />
            ))}
          </div>
        )}
        {/* Milestone: the reactions (and Share on yours) in one row. */}
        {item.milestone && (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {reactions}
              {item.isMine && onShare && (
                <UiButton size="sm" variant="ghost" onClick={onShare}>
                  <Share2 size={15} /> Share card
                </UiButton>
              )}
            </div>
          </>
        )}
        {item.milestone && reactions ? null : reactions ? (
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
              'tnum inline-flex items-center gap-1.5 rounded-full border border-border py-1 pl-2 pr-3 text-[13px] font-medium shadow-xs',
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

/** "Maya", "Maya and Priya", "Maya, Priya and Dre". */
function listNames(names: string[]) {
  if (names.length < 3) return names.join(' and ')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}
