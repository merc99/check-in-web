'use client'

// Pattern: mmo fx kit / reveal card (adapted to Check-in). The milestone moment: shown when a
// check-in unlocks an achievement. Tap to reveal: the medal shakes, a beam rises, the card floods with
// the achievement's hue and a burst goes off. Motion budget: achievements only.
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/checkin/Button'
import { HUE_CLASS } from '@/lib/colors'
import type { Achievement } from '@/lib/data'
import { prefersReducedMotion } from '@/lib/motion'
import { burstFrom } from './burst'
import { FX } from './config'
import { sfx } from './sound'
import styles from './RevealCard.module.css'

export function RevealCard({ achievement: a, onClose }: { achievement: Achievement; onClose: () => void }) {
  const [stage, setStage] = useState<'closed' | 'shaking' | 'open'>('closed')
  const card = useRef<HTMLDivElement>(null)
  const action = useRef<HTMLButtonElement>(null)
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  })

  // Escape closes; focus starts on the button and returns to where it was.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    action.current?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current()
      if (e.key === 'Tab') {
        e.preventDefault() // one button: keep focus on it
        action.current?.focus()
      }
    }
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('keydown', key)
      previous?.focus?.({ preventScroll: true })
    }
  }, [])

  const reveal = () => {
    if (stage !== 'closed') return
    setStage('shaking')
    sfx('charge')
    window.setTimeout(
      () => {
        setStage('open')
        if (card.current) burstFrom(card.current, [`--${a.color}`, 'white', `--${a.color}`, '--primary'], FX.revealBurstCount)
        sfx('levelUp')
        requestAnimationFrame(() => action.current?.focus())
      },
      prefersReducedMotion() ? 0 : FX.revealShakeMs,
    )
  }

  const open = stage === 'open'
  return createPortal(
    <div className={styles.reveal} role="dialog" aria-modal="true" aria-label={open ? `Unlocked: ${a.title}` : 'You unlocked something'}>
      <div className={styles.scrim} onClick={onClose} />
      <div ref={card} className={styles.card} style={{ '--hue': HUE_CLASS[a.color].cssVar } as CSSProperties} data-open={open ? '' : undefined}>
        <div className={styles.medal} data-shake={stage === 'shaking' ? '' : undefined} aria-hidden="true">
          <span className={styles.beam} />
          <span className={styles.glyph}>{open ? a.glyph : '?'}</span>
        </div>
        <p className="font-display text-[28px] leading-none tracking-tighter">{open ? a.title : 'You unlocked something'}</p>
        <p className="text-[14.5px] font-medium" aria-live="polite">
          {open ? `${a.subtitle}. That one’s yours for good.` : 'Tap to see what you earned.'}
        </p>
        <Button ref={action} size="sm" variant={open ? 'dark' : 'primary'} className="mt-3" onClick={open ? onClose : reveal}>
          {open ? 'Keep going' : 'Reveal it'}
        </Button>
      </div>
    </div>,
    document.body,
  )
}
