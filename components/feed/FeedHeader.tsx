'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { CrewDot } from '@/components/checkin/CrewBlock'
import { IconLink } from '@/components/checkin/IconButton'
import { ChevronIcon, GearIcon } from '@/components/checkin/icons'
import { cn } from '@/lib/utils'
import type { Hue } from '@/lib/colors'
import type { CrewPattern } from '@/lib/crewStyle'
import { prefersReducedMotion, useScrolledPast } from '@/lib/motion'

export interface FeedHeaderCrew {
  id: string
  name: string
  color: Hue
  emoji: string | null
  pattern: CrewPattern
  memberCount: number
  inToday: number
  /** Crew streak: consecutive days with someone in. */
  streak: number
}

/**
 * The crew you're looking at, as a quiet header (Rivals-style): the crew's color as a dot, the name
 * (tap to switch crews), a muted line of facts, the gear and, on phones, who's in today (`today`, a
 * TodayStrip). Past 70px of scroll it collapses into a sticky bar. Both open the crew switcher.
 */
export function FeedHeader({
  group, onSwitch, today, onSwipe, position,
}: {
  group: FeedHeaderCrew
  onSwitch: () => void
  today?: ReactNode
  /** Phones: a sideways swipe on the banner moves to the next (1) or previous (-1) crew. */
  onSwipe?: (dir: 1 | -1) => void
  /** Which of your crews this is, for the dots on phones. */
  position?: { index: number; count: number }
}) {
  const collapsed = useScrolledPast(70)
  const swipe = useBannerSwipe(group.id, onSwipe)

  return (
    <>
      <header
        // Takes no space until you scroll; then it's a quiet sticky bar with the crew's dot and name.
        className={cn(
          'sticky top-0 z-20 -mx-5 -mb-[64px] flex h-16 items-center gap-3 border-b px-5 transition-[background-color,border-color,opacity] duration-200',
          collapsed ? 'border-border bg-background/85 opacity-100 backdrop-blur-xl' : 'pointer-events-none border-transparent bg-transparent opacity-0',
        )}
      >
        <button
          type="button"
          onClick={onSwitch}
          aria-label="Switch crew"
          tabIndex={collapsed ? 0 : -1}
          aria-hidden={!collapsed}
          className={cn(
            'hit-44 inline-flex min-w-0 items-center gap-2 px-1 py-2 text-[16px] font-medium transition-[opacity,transform] duration-200 ease-out',
            collapsed ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
          )}
        >
          <CrewDot color={group.color} className="size-[10px] border-0" />
          <span className="truncate">{group.name}</span>
          <ChevronIcon size={16} className="flex-none text-muted-foreground" />
        </button>
        <span className="flex-1" />
        {collapsed && (
          <IconLink href={`/group-settings/${group.id}`} label="Crew settings">
            <GearIcon size={18} />
          </IconLink>
        )}
      </header>

      {/* The crew you're looking at, kept quiet so the feed leads: the crew's color as a dot, the name
          (tap to switch crews), one muted line of facts and the gear. The wrapper takes the swipe
          (touch only; pan-y keeps the page scrolling up and down). */}
      <div ref={swipe} className={cn('mb-4 pt-5', onSwipe && 'touch-pan-y')}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1>
              <button
                type="button"
                onClick={onSwitch}
                aria-haspopup="dialog"
                className="group hit-44 inline-flex max-w-full items-center gap-2 text-left text-[24px] font-medium leading-[1.15] tracking-tighter sm:text-[28px]"
              >
                <CrewDot color={group.color} className="size-[10px] border-0" />
                <span className="truncate">{group.name}</span>
                <ChevronIcon
                  size={18}
                  className="flex-none text-muted-foreground transition-[transform,color] duration-150 ease-out group-hover:translate-y-px group-hover:text-foreground"
                />
              </button>
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
              <span>
                <span className="tnum">{group.memberCount}</span> members
              </span>
              {group.streak > 1 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    <span className="tnum text-foreground">{group.streak}</span>-day crew streak
                  </span>
                </>
              )}
              {/* Which crew this is, on phones (a swipe moves along them). */}
              {onSwipe && position && position.count > 1 && (
                <span className="ml-1 inline-flex items-center gap-1 lg:hidden" aria-label={`Crew ${position.index + 1} of ${position.count}. Swipe to switch.`}>
                  {Array.from({ length: position.count }, (_, i) => (
                    <span key={i} className={cn('h-[6px] rounded-full transition-[width,background-color] duration-200 ease-out', i === position.index ? 'w-4 bg-foreground' : 'w-[6px] bg-border-strong')} />
                  ))}
                </span>
              )}
            </p>
          </div>
          <IconLink href={`/group-settings/${group.id}`} label="Crew settings">
            <GearIcon size={18} />
          </IconLink>
        </div>
        {today}
      </div>
    </>
  )
}

/**
 * A sideways swipe on the banner (touch and pen; the mouse has the name button and the sidebar).
 * The banner follows the finger, then either slides out and the next crew's slides in from the
 * other side, or springs back. A swipe never also counts as a tap on the name.
 */
function useBannerSwipe(crewId: string, onSwipe?: (dir: 1 | -1) => void) {
  const el = useRef<HTMLDivElement>(null)
  const enterFrom = useRef<1 | -1 | 0>(0)
  const cb = useRef(onSwipe)
  useEffect(() => {
    cb.current = onSwipe
  })

  const enabled = !!onSwipe
  useEffect(() => {
    const node = el.current
    if (!node || !enabled) return
    let s: { x: number; y: number; t: number; dx: number; axis: 'x' | 'y' | null; id: number } | null = null
    let swallow = false
    const reset = (animate: boolean) => {
      node.style.transition = animate ? 'transform 200ms var(--ease-out), opacity 200ms var(--ease-out)' : 'none'
      node.style.transform = ''
      node.style.opacity = ''
    }
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return
      s = { x: e.clientX, y: e.clientY, t: e.timeStamp, dx: 0, axis: null, id: e.pointerId }
    }
    const move = (e: PointerEvent) => {
      if (!s || e.pointerId !== s.id) return
      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      if (!s.axis) {
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) s.axis = 'x'
        else if (Math.abs(dy) > 10) {
          s = null // the page is scrolling
          return
        } else return
      }
      s.dx = dx
      if (prefersReducedMotion()) return
      node.style.transition = 'none'
      node.style.transform = `translateX(${dx * 0.6}px) rotate(${dx * 0.012}deg)`
      node.style.opacity = String(1 - Math.min(0.4, Math.abs(dx) / 500))
    }
    const up = (e: PointerEvent) => {
      const g = s
      s = null
      if (!g || g.axis !== 'x') return
      swallow = true
      window.setTimeout(() => (swallow = false), 0)
      const speed = Math.abs(g.dx) / Math.max(1, e.timeStamp - g.t)
      if (Math.abs(g.dx) < 70 && speed < 0.5) return reset(true)
      const dir: 1 | -1 = g.dx < 0 ? 1 : -1
      enterFrom.current = dir
      if (prefersReducedMotion()) return cb.current?.(dir)
      node.style.transition = 'transform 150ms var(--ease-in), opacity 150ms var(--ease-in)'
      node.style.transform = `translateX(${dir * -70}px)`
      node.style.opacity = '0'
      window.setTimeout(() => cb.current?.(dir), 150)
    }
    const cancel = () => {
      if (s?.axis === 'x') reset(true)
      s = null
    }
    // A swipe ends on the name button sometimes: that release is not a tap.
    const click = (e: MouseEvent) => {
      if (!swallow) return
      e.stopPropagation()
      e.preventDefault()
    }
    node.addEventListener('pointerdown', down)
    node.addEventListener('pointermove', move)
    node.addEventListener('pointerup', up)
    node.addEventListener('pointercancel', cancel)
    node.addEventListener('click', click, true)
    return () => {
      node.removeEventListener('pointerdown', down)
      node.removeEventListener('pointermove', move)
      node.removeEventListener('pointerup', up)
      node.removeEventListener('pointercancel', cancel)
      node.removeEventListener('click', click, true)
    }
  }, [enabled])

  // The next crew's banner slides in from the side the swipe came from.
  useEffect(() => {
    const node = el.current
    const dir = enterFrom.current
    enterFrom.current = 0
    if (!node) return
    if (!dir || prefersReducedMotion()) {
      node.style.transition = 'none'
      node.style.transform = ''
      node.style.opacity = ''
      return
    }
    node.style.transition = 'none'
    node.style.transform = `translateX(${dir * 70}px)`
    node.style.opacity = '0'
    void node.offsetWidth
    node.style.transition = 'transform 200ms var(--ease-out), opacity 200ms var(--ease-out)'
    node.style.transform = ''
    node.style.opacity = ''
  }, [crewId])

  return el
}
