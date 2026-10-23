'use client'

// Pattern: 100K Club Premium UI Kit / holographic foil card (adapted to Check-in tokens). See Foil.module.css.
import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import styles from './Foil.module.css'

export interface FoilProps {
  /** Sheen color. Defaults to the brand mint. */
  hue?: Hue
  /** Largest tilt in degrees at the card's edge. Small reads expensive, large reads toy. */
  tilt?: number
  /** Sheen opacity under the pointer (0 to 1). */
  strength?: number
  /** Turns the effect off (locked achievements), leaving just the content. */
  disabled?: boolean
  className?: string
  children: ReactNode
}

/**
 * A foil finish for something earned. Wrap the card in `Foil`, and put `<FoilLight />` inside it. With a mouse, the card tilts toward the pointer while a
 * sheen and a glare move across it; on touch, a tap plays one sweep. It never moves on its own.
 * The pointer only writes --mx / --my; the CSS draws everything.
 */
export function Foil({ hue, tilt = 10, strength = 0.4, disabled, className, children }: FoilProps) {
  const ref = useRef<HTMLDivElement>(null)

  if (disabled) return <div className={className}>{children}</div>

  const track = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)).toFixed(3))
    el.style.setProperty('--my', Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)).toFixed(3))
    el.setAttribute('data-active', '')
  }

  const leave = () => {
    ref.current?.removeAttribute('data-active')
  }

  // A tap on a touch screen: replay the sweep (removing and re-adding the attribute restarts it).
  const tap = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') return
    const el = ref.current
    if (!el) return
    el.removeAttribute('data-shine')
    void el.offsetWidth
    el.setAttribute('data-shine', '')
  }

  const vars = {
    '--hue': hue ? HUE_CLASS[hue].cssVar : 'var(--primary)',
    '--tilt': tilt,
    '--strength': strength,
  } as CSSProperties

  return (
    <div
      ref={ref}
      className={cn(styles.foil, className)}
      style={vars}
      onPointerMove={track}
      onPointerLeave={leave}
      onPointerDown={tap}
      onAnimationEnd={(e) => {
        if (e.animationName.includes('shineGlare')) ref.current?.removeAttribute('data-shine')
      }}
    >
      <div className={styles.surface}>{children}</div>
    </div>
  )
}

/**
 * The sheen and glare. Put it inside the card (a `relative overflow-hidden` element) so the light
 * is clipped to the card's own shape and follows its corners and rotation.
 */
export function FoilLight() {
  return (
    <>
      <span aria-hidden="true" className={styles.sheen} />
      <span aria-hidden="true" className={styles.glare} />
    </>
  )
}
