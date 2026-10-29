import type { CSSProperties } from 'react'
import { Foil, FoilLight } from '@/components/fx/Foil'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import { SKILL_LABEL, tierOf, type SkillKind, type TierKey } from '@/lib/mastery'
import { cn } from '@/lib/utils'
import styles from './TierCard.module.css'

const MATERIAL: Record<ReturnType<typeof tierOf>['material'], string> = {
  paper: styles.paper,
  enamel: styles.enamel,
  foil: styles.foil,
  holo: styles.holo,
  aurora: styles.aurora,
  master: styles.locked,
}

export interface TierCardProps {
  tier: TierKey
  skill: SkillKind
  crewName: string
  color: Hue
  /** The person's sessions in this skill (shown under the tier name). */
  sessions: number
  /** Not reached yet: a dashed silhouette (Master, or a preview of the next tier). */
  locked?: boolean
  size?: 'md' | 'sm'
  className?: string
}

/**
 * A mastery tier as a card: the material says the tier (paper, enamel, foil, holo, holo with an
 * aurora edge), the medal shows the tier's session number. Foil and up tilt toward a mouse (fx/Foil).
 */
export function TierCard({ tier, skill, crewName, color, sessions, locked, size = 'md', className }: TierCardProps) {
  const t = tierOf(tier)
  const material = locked ? styles.locked : MATERIAL[t.material]
  const shiny = !locked && (t.material === 'foil' || t.material === 'holo' || t.material === 'aurora')
  const card = (
    <div
      className={cn(styles.card, material, size === 'sm' && styles.sm, className)}
      style={{ '--hue': HUE_CLASS[color].cssVar } as CSSProperties}
      role="img"
      aria-label={locked ? `${t.name}, ${t.at.toLocaleString()} sessions, not reached yet` : `${t.name} in ${crewName} (${SKILL_LABEL[skill].toLowerCase()}), ${sessions} sessions`}
    >
      <span aria-hidden="true" className={styles.medal}>
        {t.at >= 1000 ? '1K' : t.at}
      </span>
      <span aria-hidden="true" className="min-w-0 flex-1">
        <span className={cn('block truncate font-semibold opacity-75', size === 'sm' ? 'text-[12px]' : 'text-[12.5px]')}>{crewName}</span>
        <span className={cn('block font-display font-extrabold leading-[1.05] tracking-tighter', size === 'sm' ? 'text-[19px]' : 'text-[26px]')}>
          {t.name}
        </span>
        <span className={cn('tnum block font-semibold', size === 'sm' ? 'text-[12px]' : 'text-[13px]')}>
          {locked ? `${t.at.toLocaleString()} sessions` : `${sessions.toLocaleString()} session${sessions === 1 ? '' : 's'}`}
        </span>
      </span>
      {shiny && <FoilLight />}
    </div>
  )
  return shiny ? <Foil hue="white">{card}</Foil> : card
}
