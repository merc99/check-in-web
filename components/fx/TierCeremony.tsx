'use client'

// The tier-up ceremony (mastery, slice 2): a face-down card rises, you tap it, it flips, and the
// finish grows with the tier (see TierCeremony.module.css). Replaces the plain reveal for tier-ups.
// Motion budget: a moment, only when your own session reaches a tier.
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { TierCard } from '@/components/checkin/TierCard'
import { Button } from '@/components/ui/button'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import { tierOf, type SkillKind, type TierKey } from '@/lib/mastery'
import { prefersReducedMotion } from '@/lib/motion'
import { burstFrom } from './burst'
import { sfx } from './sound'
import styles from './TierCeremony.module.css'

export interface CeremonyProps {
  tier: TierKey
  skill: SkillKind
  crewName: string
  color: Hue
  sessions: number
  /** Share of members who reach this tier, 0–100. */
  rarity?: number
  /** Master only. */
  serial?: number | null
  onShare?: () => void
  onClose: () => void
}

/** How dark the room goes, and how big the burst is, by tier. */
const DIM: Record<string, number> = { paper: 0.6, enamel: 0.64, foil: 0.68, holo: 0.74, aurora: 0.8, master: 0.86 }
const BURST: Record<string, number> = { paper: 14, enamel: 22, foil: 36, holo: 70, aurora: 90, master: 140 }

export function TierCeremony({ tier, skill, crewName, color, sessions, rarity, serial, onShare, onClose }: CeremonyProps) {
  const t = tierOf(tier)
  const [open, setOpen] = useState(false)
  const card = useRef<HTMLDivElement>(null)
  const back = useRef<HTMLButtonElement>(null)
  const action = useRef<HTMLButtonElement>(null)
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  })

  // Escape closes; focus starts on the card back and returns to where it was.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    back.current?.focus()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close.current()
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('keydown', key)
      previous?.focus?.({ preventScroll: true })
    }
  }, [])

  const reveal = () => {
    if (open) return
    setOpen(true)
    sfx('charge')
    const big = t.material === 'holo' || t.material === 'aurora' || t.material === 'master'
    const colors = big ? ['--rose', '--sky', '--lemon', '--grape', '--leaf', 'white'] : [`--${color}`, 'white', '--primary']
    window.setTimeout(
      () => {
        if (card.current) burstFrom(card.current, colors, BURST[t.material])
        sfx('levelUp')
        requestAnimationFrame(() => action.current?.focus())
      },
      prefersReducedMotion() ? 0 : 650,
    )
  }

  return createPortal(
    <div className={styles.root} role="dialog" aria-modal="true" aria-label={open ? `${t.name} in ${crewName}` : 'You reached a new tier'}>
      <div className={styles.scrim} style={{ '--dim': DIM[t.material] } as CSSProperties} onClick={open ? onClose : undefined} />
      <div className={styles.stage} data-open={open ? '' : undefined} data-m={t.material} style={{ '--hue': HUE_CLASS[color].cssVar } as CSSProperties}>
        <p className="text-[13px] font-semibold opacity-80">{open ? 'New tier' : 'You reached a new tier'}</p>
        <div className={styles.flip}>
          <div className={styles.flipper}>
            <div ref={card} className={styles.face} aria-hidden={!open}>
              <TierCard tier={tier} skill={skill} crewName={crewName} color={color} sessions={sessions} />
              <span className={styles.fx} aria-hidden="true" />
            </div>
            <button ref={back} type="button" className={styles.back} onClick={reveal} aria-label="Flip the card">
              <span aria-hidden="true">?</span>
            </button>
          </div>
        </div>
        <div className={styles.words} aria-live="polite">
          {open && (
            <>
              <p className="font-display text-[34px] font-extrabold leading-none tracking-tighter">{t.name}</p>
              <p className="text-[15px] font-medium opacity-90">
                {sessions} sessions in {crewName}.{' '}
                {t.key === 'master' && serial ? `Master card No. ${String(serial).padStart(4, '0')}.` : 'That one’s yours for good.'}
              </p>
              {rarity !== undefined && <p className="text-[13px] opacity-75">Reached by {rarity < 1 ? 'under 1' : rarity}% of members.</p>}
              <div className="mt-3 flex justify-center gap-2">
                {onShare && (
                  <Button size="sm" variant="secondary" onClick={onShare}>
                    Share card
                  </Button>
                )}
                <Button ref={action} size="sm" onClick={onClose}>
                  Keep going
                </Button>
              </div>
            </>
          )}
          {!open && <p className="text-[14px] opacity-80">Tap the card to flip it.</p>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
