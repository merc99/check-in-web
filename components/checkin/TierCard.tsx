import { BadgeCheck, CalendarCheck, Crown, Flame, Gem, Mountain, Sprout, type LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Foil, FoilLight } from '@/components/fx/Foil'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import { SKILL_LABEL, tierOf, type SkillKind, type TierKey } from '@/lib/mastery'
import { cn } from '@/lib/utils'
import styles from './TierCard.module.css'
import badge from './TierBadge.module.css'

const MATERIAL: Record<ReturnType<typeof tierOf>['material'], string> = {
  paper: styles.paper,
  enamel: styles.enamel,
  foil: styles.foil,
  holo: styles.holo,
  aurora: styles.aurora,
  master: styles.aurora,
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
  /** Master cards: their number ("No. 0007"). */
  serial?: number | null
  /** Two or more crewmates vouched for it. */
  verified?: boolean
  size?: 'md' | 'sm'
  /** Binder: a trading-card shape (medal on top, centered words). */
  portrait?: boolean
  className?: string
}

const BADGE_ICON: Record<TierKey, LucideIcon> = {
  started: Sprout,
  habit: CalendarCheck,
  committed: Flame,
  seasoned: Mountain,
  expert: Gem,
  master: Crown,
}
const BADGE_RIM: Record<ReturnType<typeof tierOf>['material'], string> = {
  paper: badge.paper,
  enamel: badge.enamel,
  foil: badge.foil,
  holo: badge.holo,
  aurora: badge.holo,
  master: badge.holo,
}

/**
 * The tier as a small coin, for a milestone post's line (see TierBadge.module.css): the tier's icon on
 * the crew's hue, the rim by tier. The post's text says the tier and the count, so it's decorative.
 */
export function TierMedal({ tier, color, className }: { tier: TierKey; color: Hue; className?: string }) {
  const t = tierOf(tier)
  const Icon = BADGE_ICON[tier]
  return (
    <span aria-hidden="true" className={cn(badge.badge, BADGE_RIM[t.material], className)} style={{ '--hue': HUE_CLASS[color].cssVar } as CSSProperties}>
      <span className={badge.face}>
        <Icon size={19} strokeWidth={1.75} />
      </span>
    </span>
  )
}

/**
 * A mastery tier as a card: the material says the tier (paper, enamel, foil, holo, holo with an
 * aurora edge), the medal shows the tier's session number. Foil and up carry the sheen (fx/Foil); a tap sweeps it on touch, nothing moves on hover.
 */
export function TierCard({ tier, skill, crewName, color, sessions, locked, serial, verified, size = 'md', portrait, className }: TierCardProps) {
  const t = tierOf(tier)
  const material = locked ? styles.locked : MATERIAL[t.material]
  const shiny = !locked && (t.material === 'foil' || t.material === 'holo' || t.material === 'aurora')
  const card = (
    <div
      className={cn(styles.card, material, size === 'sm' && styles.sm, portrait && styles.portrait, className)}
      style={{ '--hue': HUE_CLASS[color].cssVar } as CSSProperties}
      role="img"
      aria-label={locked ? `${t.name}, ${t.at.toLocaleString()} sessions, not reached yet` : `${t.name} in ${crewName} (${SKILL_LABEL[skill].toLowerCase()}), ${sessions} sessions${verified ? ', verified' : ''}`}
    >
      <span aria-hidden="true" className={styles.medal}>
        {t.at >= 1000 ? '1K' : t.at}
      </span>
      <span aria-hidden="true" className="min-w-0 flex-1">
        <span className={cn('block truncate font-semibold opacity-75', size === 'sm' ? 'text-[12px]' : 'text-[13px]')}>{crewName}</span>
        <span className={cn('block font-display font-extrabold leading-[1.05] tracking-tighter', portrait ? 'text-[22px]' : size === 'sm' ? 'text-[19px]' : 'text-[26px]')}>
          {t.name}
        </span>
        <span className={cn('tnum block font-semibold', size === 'sm' ? 'text-[12px]' : 'text-[13px]')}>
          {locked ? `${t.at.toLocaleString()} sessions` : `${sessions.toLocaleString()} session${sessions === 1 ? '' : 's'}`}
          {!locked && serial ? `, No. ${String(serial).padStart(4, '0')}` : ''}
        </span>
      </span>
      {verified && !locked && (
        <span aria-hidden="true" className={cn('absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-on-color py-[3px] text-[12px] font-bold text-white', portrait ? 'px-[5px]' : 'px-2')}>
          <BadgeCheck size={13} strokeWidth={2.25} /> {!portrait && 'Verified'}
        </span>
      )}
      {shiny && <FoilLight />}
    </div>
  )
  return shiny ? <Foil hue="white">{card}</Foil> : card
}
