import type { CSSProperties, HTMLAttributes } from 'react'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import { cn } from '@/lib/utils'
import styles from './CrewTint.module.css'

export type CrewTintLevel = 'plain' | 'glow' | 'holo'

/**
 * A crew's hue washed into a card (the feed header, milestone posts). `glow` adds a soft halo and a
 * brighter edge for big moments; `holo` adds a still holo edge on top (Seasoned and up).
 */
export function crewTint(hue: Hue, level: CrewTintLevel = 'plain') {
  return {
    className: cn(styles.tint, level !== 'plain' && styles.glow, level === 'holo' && styles.holo),
    style: { '--hue': HUE_CLASS[hue].cssVar } as CSSProperties,
  }
}

export function CrewTint({ hue, level = 'plain', className, style, ...rest }: HTMLAttributes<HTMLDivElement> & { hue: Hue; level?: CrewTintLevel }) {
  const t = crewTint(hue, level)
  return <div className={cn(t.className, className)} style={{ ...t.style, ...style }} {...rest} />
}
