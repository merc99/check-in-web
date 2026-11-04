import type { CSSProperties, HTMLAttributes } from 'react'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import { cn } from '@/lib/utils'
import styles from './CrewTint.module.css'

export type CrewTintLevel = 'plain' | 'glow' | 'holo'

/**
 * A crew's card as a printed, matte thing (the feed header, the crew switcher, milestone posts, your
 * card on You): a clean tint of the hue, one metallic sheen, a lit top edge, a soft glow.
 * `glow` is brighter for big moments; `holo` adds a still holo hairline (Seasoned and up).
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

/** Recessed silver lettering, for a big name on a tinted card. */
export const engraved = styles.engraved
/** A recessed well on a tinted card (the pinned note, a strip of numbers). */
export const tintWell = styles.well

