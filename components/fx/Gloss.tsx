// Glossy crew-hue panels, pills and sparklines (pattern: mmo nodes stats panels, adapted). Static
// surfaces: the only motion is the sparkline drawing itself in once.
import { useId, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
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
 * A small line chart with a soft fill under it and a dot on the latest value. Uses currentColor.
 * `label` describes it for screen readers ("Check-ins per week, last 12 weeks: …").
 */
export function Sparkline({ values, label, className, height = 56 }: { values: number[]; label: string; className?: string; height?: number }) {
  const id = useId().replace(/:/g, '')
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
  // The line stretches to the width; the dot is HTML on top, so it stays round.
  return (
    <div className={cn('relative', className)} style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block size-full overflow-visible" role="img" aria-label={label}>
        <defs>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity=".35" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className={styles.area} d={`${d} L${last[0]},${h} L${pts[0][0]},${h} Z`} fill={`url(#a${id})`} />
        <path className={styles.line} d={d} pathLength={1} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span
        aria-hidden="true"
        className={cn(styles.dot, 'absolute size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-current')}
        style={{ left: `${(last[0] / w) * 100}%`, top: `${(last[1] / h) * 100}%` }}
      />
    </div>
  )
}
