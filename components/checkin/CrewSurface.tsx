import type { CSSProperties, HTMLAttributes } from 'react'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import { cn } from '@/lib/utils'
import styles from './CrewSurface.module.css'

/** A crew's own surface: its hue with depth, grain and a lit top edge. Text on it is dark ink. */
export function CrewSurface({ hue, className, style, children, ...rest }: HTMLAttributes<HTMLDivElement> & { hue: Hue }) {
  return (
    <div className={cn(styles.surface, className)} style={{ '--hue': HUE_CLASS[hue].cssVar, ...style } as CSSProperties} {...rest}>
      {children}
    </div>
  )
}

/** The crew's emoji (or first letter) as a dark enamel badge. Place it inside a CrewSurface. */
export function CrewMedal({ name, emoji, className }: { name: string; emoji: string | null; className?: string }) {
  return (
    <span aria-hidden="true" className={cn(styles.medal, className)}>
      {emoji ?? <span className="font-display text-white">{(name.trim()[0] ?? '?').toUpperCase()}</span>}
    </span>
  )
}
