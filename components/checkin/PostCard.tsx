'use client'

import { useRef, useState, type PointerEvent } from 'react'
import { cn } from '@/lib/utils'
import type { FeedItem } from '@/lib/data'
import { HOUR, timeAgo } from '@/lib/dates'
import { prefersReducedMotion } from '@/lib/motion'
import { useNow } from '@/lib/useNow'
import { Avatar } from './Avatar'
import { TagChip } from './Chip'
import { HEART_PATH } from './icons'

const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_PX = 30

export interface PostCardProps {
  item: FeedItem
  /** Plays the drop-in (new arrival or your fresh post). */
  entering?: boolean
  onHeart: (on: boolean) => void
  onPersonTap?: (id: string) => void
}

/** One check-in. Heart pill, who hearted, and double-tap anywhere on the card to heart it. */
export function PostCard({ item, entering, onHeart, onPersonTap }: PostCardProps) {
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
    if ((e.target as HTMLElement).closest('button,a')) return
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
        'relative touch-manipulation select-none rounded-lg border border-border p-4 shadow-card',
        item.isMine ? 'bg-card' : 'bg-card',
        entering && 'animate-enter',
      )}
    >
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
          <span className="ml-auto rounded-full bg-primary-soft px-2 text-primary-ink py-[5px] text-[10.5px] font-bold leading-none tracking-[.08em] shadow-xs">
            JUST IN
          </span>
        )}
      </div>

      <div className="-mt-1 pl-[52px]">
        {item.note && <p className="text-base leading-[1.45]">{item.note}</p>}
        {item.tags.length > 0 && (
          <div className="mt-[10px] flex flex-wrap gap-2">
            {item.tags.map((t) => (
              <TagChip key={t.id} name={t.name} />
            ))}
          </div>
        )}
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
