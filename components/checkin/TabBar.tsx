'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { CompassIcon, FeedIcon, UserIcon } from './icons'

export type TabKey = 'explore' | 'feed' | 'you'

export const TABS = [
  { key: 'explore', label: 'Explore', href: '/explore', Icon: CompassIcon },
  { key: 'feed', label: 'Feed', href: '/feed', Icon: FeedIcon },
  { key: 'you', label: 'You', href: '/you', Icon: UserIcon },
] as const

export interface TabBarProps {
  active: TabKey
  /** Render buttons instead of links (kitchen sink, tests). */
  onSelect?: (key: TabKey) => void
}

/** Three tabs with an ink pill that springs between them. */
export function TabBar({ active, onSelect }: TabBarProps) {
  const index = TABS.findIndex((t) => t.key === active)
  return (
    <nav aria-label="Main" className="relative flex rounded-full border border-border bg-card p-[6px] shadow-card">
      <span
        aria-hidden="true"
        className="absolute inset-y-[6px] left-[6px] w-[calc((100%-12px)/3)] rounded-full bg-foreground transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {TABS.map(({ key, label, href, Icon }) => {
        const current = key === active
        const className = cn(
          'relative z-1 flex flex-1 items-center justify-center gap-[6px] rounded-full px-1 py-[11px] text-[13.5px] font-bold transition-colors duration-200',
          current ? 'text-background' : 'text-muted-foreground',
        )
        const inner = (
          <>
            <Icon size={19} />
            {label}
          </>
        )
        return onSelect ? (
          <button
            key={key}
            type="button"
            aria-current={current ? 'page' : undefined}
            onClick={() => onSelect(key)}
            className={className}
          >
            {inner}
          </button>
        ) : (
          <Link key={key} href={href} aria-current={current ? 'page' : undefined} className={className}>
            {inner}
          </Link>
        )
      })}
    </nav>
  )
}

/** The fixed bottom dock. Slides away on routes that aren't one of the three tabs. */
export function TabBarDock() {
  const pathname = usePathname()
  const match = TABS.find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.key
  // Keep the last tab while hidden so the pill doesn't jump as the dock slides out.
  const [last, setLast] = useState<TabKey>('feed')
  if (match && match !== last) setLast(match)
  const dock = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dock.current?.toggleAttribute('inert', !match)
  }, [match])

  return (
    <div
      ref={dock}
      aria-hidden={!match}
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-24 mx-auto max-w-app px-4 pb-[calc(14px+env(safe-area-inset-bottom))]',
        'transition-transform duration-200 ease-out',
        match ? 'translate-y-0' : 'translate-y-[130%]',
      )}
    >
      <div className="pointer-events-auto">
        <TabBar active={last} />
      </div>
    </div>
  )
}
