'use client'

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { SheenLoop } from '@/components/fx/loops'
import { cn } from '@/lib/utils'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import styles from './Ticket.module.css'

/**
 * Invite ticket in the crew color: a main section, a perforated divider with two half-circle notches
 * cut clean through the ticket (a mask, so the page shows through), and a stub below. A soft
 * iridescent sheen glides across the surface (fx/SheenLoop), under the content: invite tickets are
 * the one place that loop is allowed.
 */
export function Ticket({
  color, top, bottom, className,
}: { color: Hue; top: ReactNode; bottom: ReactNode; className?: string }) {
  const ticket = useRef<HTMLDivElement>(null)
  const divider = useRef<HTMLDivElement>(null)

  // The notches sit on the perforation, wherever the top section ends.
  useLayoutEffect(() => {
    const t = ticket.current
    const d = divider.current
    if (!t || !d) return
    const place = () => t.style.setProperty('--y', `${d.offsetTop}px`)
    place()
    const ro = new ResizeObserver(place)
    ro.observe(t)
    return () => ro.disconnect()
  }, [])

  return (
    <div className={cn(styles.wrap, className)}>
      <div ref={ticket} className={styles.ticket} style={{ '--hue': HUE_CLASS[color].cssVar } as CSSProperties}>
        <SheenLoop />
        <div className={styles.content}>{top}</div>
        <div ref={divider} aria-hidden="true" className={styles.divider} />
        <div className={styles.content}>{bottom}</div>
      </div>
    </div>
  )
}

/** The invite code as letter tiles pressed into the ticket. Bump `wave` to make the letters hop in sequence. */
export function CodeTiles({ code, wave }: { code: string; wave: number }) {
  return (
    <span key={wave} className="flex gap-[6px]" aria-hidden="true">
      {code.split('').map((ch, i) => (
        <span
          key={i}
          className={cn(styles.tile, wave > 0 && 'animate-wave')}
          style={wave > 0 ? { animationDelay: `${i * 0.05}s` } : undefined}
        >
          {ch}
        </span>
      ))}
    </span>
  )
}
