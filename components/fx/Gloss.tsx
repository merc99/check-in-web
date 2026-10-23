'use client'

// Glossy crew-hue panels, pills and sparklines (pattern: mmo nodes stats panels, adapted). Static
// surfaces; the sparkline can be scrubbed.
import { useId, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import styles from './Gloss.module.css'

/** A glossy panel in a crew hue. Text inside is the dark on-color ink. */
export function Gloss({ hue, className, style, children, ...rest }: HTMLAttributes<HTMLDivElement> & { hue: Hue | 'primary' }) {
  const vars = { '--hue': hue === 'primary' ? 'var(--primary)' : HUE_CLASS[hue].cssVar, ...style } as CSSProperties
  return (
    <div className={cn(styles.gloss, className)} style={vars} {...rest}>
      {children}
    </div>
  )
}

/** A frosted inner panel inside a Gloss. */
export function GlassInset({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(styles.inset, className)}>{children}</div>
}

/** A label pill on a Gloss. `solid` inverts it (dark pill, hue text) for the one thing to notice. */
export function GlossPill({ solid, className, children }: { solid?: boolean; className?: string; children: ReactNode }) {
  return <span className={cn(styles.pill, solid && styles.pillSolid, className)}>{children}</span>
}

/**
 * A small line chart with a soft fill under it. Uses currentColor. Scrub it: a mouse or a finger
 * across it (or the arrow keys when focused) shows a guide line, a dot and `pointLabel(i)` for the
 * nearest point. `label` describes the whole chart for screen readers.
 */
export function Sparkline({
  values, label, pointLabel, className, height = 56,
}: { values: number[]; label: string; pointLabel?: (i: number) => string; className?: string; height?: number }) {
  const id = useId().replace(/:/g, '')
  const box = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)
  const w = 200
  const h = height
  const pad = 4
  const max = Math.max(1, ...values)
  const pts = values.map((v, i) => [pad + (i * (w - pad * 2)) / Math.max(1, values.length - 1), h - pad - (v / max) * (h - pad * 2)] as const)
  // A gentle curve through the points (Catmull-Rom as cubic Béziers).
  const d = pts
    .map(([x, y], i) => {
      if (i === 0) return `M${x},${y}`
      const [x0, y0] = pts[i - 2] ?? pts[i - 1]
      const [x1, y1] = pts[i - 1]
      const [x3, y3] = pts[i + 1] ?? [x, y]
      const c1 = [x1 + (x - x0) / 6, y1 + (y - y0) / 6]
      const c2 = [x - (x3 - x1) / 6, y - (y3 - y1) / 6]
      return `C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${x},${y}`
    })
    .join(' ')
  const last = pts[pts.length - 1]

  const nearest = (clientX: number) => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return null
    const x = ((clientX - r.left) / r.width) * w
    return Math.max(0, Math.min(values.length - 1, Math.round(((x - pad) / (w - pad * 2)) * (values.length - 1))))
  }
  const p = active === null ? null : pts[active]
  const left = (x: number) => `${(x / w) * 100}%`
  const top = (y: number) => `${(y / h) * 100}%`
  const tip = active === null ? '' : (pointLabel?.(active) ?? String(values[active]))

  return (
    <div
      ref={box}
      className={cn('relative cursor-crosshair touch-pan-y rounded-md outline-offset-2', className)}
      style={{ height }}
      tabIndex={0}
      role="group"
      aria-label={`${label}. Use the left and right arrow keys to read each point.`}
      onPointerMove={(e) => setActive(nearest(e.clientX))}
      onPointerDown={(e) => setActive(nearest(e.clientX))}
      onPointerLeave={() => setActive(null)}
      onBlur={() => setActive(null)}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        e.preventDefault()
        setActive((i) => Math.max(0, Math.min(values.length - 1, (i ?? values.length - 1) + (e.key === 'ArrowRight' ? 1 : -1))))
      }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block size-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity=".35" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className={styles.area} d={`${d} L${last[0]},${h} L${pts[0][0]},${h} Z`} fill={`url(#a${id})`} />
        <path className={styles.line} d={d} pathLength={1} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {p && (
        <>
          {/* The guide, the dot (HTML, so it stays round when the chart stretches) and the value. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-px bg-current opacity-35" style={{ left: left(p[0]) }} />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute size-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current shadow-[0_0_0_3px_rgb(255_255_255/.85)]"
            style={{ left: left(p[0]), top: top(p[1]) }}
          />
          <span
            role="status"
            className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-on-color px-2 py-1 text-[11.5px] font-bold text-white shadow-raised"
            style={{ left: `clamp(48px, ${left(p[0])}, calc(100% - 48px))`, top: `calc(${top(p[1])} - 34px)` }}
          >
            {tip}
          </span>
        </>
      )}
    </div>
  )
}
