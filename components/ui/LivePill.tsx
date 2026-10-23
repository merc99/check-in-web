'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { BrandColor } from '@/lib/colors'
import { Avatar } from './Avatar'

const HIDE_MS = 3400

export interface LiveNotice {
  user: { name: string; color?: BrandColor; photoUrl?: string | null }
  /** e.g. <><b>Dre</b> just checked in</> */
  message: ReactNode
  onTap?: () => void
}

const LiveContext = createContext<(notice: LiveNotice) => void>(() => {})

/** `const live = useLive(); live({ user, message, onTap })` */
export const useLive = () => useContext(LiveContext)

export function LiveProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<LiveNotice | null>(null)
  const [show, setShow] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const live = useCallback((next: LiveNotice) => {
    setNotice(next)
    setShow(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setShow(false), HIDE_MS)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const onTap = () => {
    clearTimeout(timer.current)
    setShow(false)
    notice?.onTap?.()
  }

  return (
    <LiveContext.Provider value={live}>
      {children}
      <LivePill notice={notice} show={show} onTap={onTap} />
    </LiveContext.Provider>
  )
}

/** White pill that drops in from the top. Tapping it runs the notice's action. */
export function LivePill({ notice, show, onTap }: { notice: LiveNotice | null; show: boolean; onTap: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(12px+env(safe-area-inset-top))] z-36 mx-auto flex max-w-app justify-center px-4"
    >
      {notice && (
        <button
          type="button"
          onClick={onTap}
          tabIndex={show ? 0 : -1}
          aria-hidden={!show}
          className={cn(
            'pointer-events-auto flex max-w-full items-center gap-[10px] whitespace-nowrap rounded-full border border-ink bg-card',
            'py-[5px] pl-[5px] pr-4 text-[13.5px] font-medium shadow-sh2',
            'transition-transform duration-550 ease-spring',
            show ? 'translate-y-0' : 'translate-y-[-90px]',
          )}
        >
          <Avatar name={notice.user.name} color={notice.user.color} photoUrl={notice.user.photoUrl} size="sm" />
          <span className="truncate">{notice.message}</span>
        </button>
      )}
    </div>
  )
}
