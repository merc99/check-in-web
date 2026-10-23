import { Card } from '@/components/checkin/Card'
import { HUE_CLASS } from '@/lib/colors'
import type { MyInsights } from '@/lib/data'
import styles from './CrewDonut.module.css'

/**
 * Where your check-ins went: a ring split by crew in each crew's hue, the total in the middle, and a
 * legend (pattern: mmo nodes "your node" ring). The segments draw in once.
 */
export function CrewDonut({ crews }: { crews: MyInsights['byCrew'] }) {
  const total = crews.reduce((n, c) => n + c.count, 0)
  const R = 42
  const C = 2 * Math.PI * R
  const GAP = crews.length > 1 ? 3 : 0 // px of air between segments
  // Where each segment starts along the ring.
  const lens = crews.map((c) => (total ? (c.count / total) * C : 0))
  const starts = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0))
  return (
    <Card size="lg" className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative size-[150px] flex-none">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={crews.map((c) => `${c.name}: ${c.count}`).join(', ')}>
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--muted)" strokeWidth="11" />
          {crews.map((c, i) => (
              <circle
                key={c.id}
                className={styles.seg}
                style={{ animationDelay: `${0.1 + i * 0.12}s` }}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={HUE_CLASS[c.color].cssVar}
                strokeWidth="11"
                strokeDasharray={`${Math.max(0, lens[i] - GAP)} ${C}`}
                strokeDashoffset={-starts[i]}
              />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="tnum font-display text-[32px] leading-none tracking-tighter">{total}</div>
            <div className="mt-1 text-[11.5px] text-muted-foreground">check-ins</div>
          </div>
        </div>
      </div>
      <ul className="flex w-full min-w-0 flex-col gap-[10px]">
        {crews.map((c) => (
          <li key={c.id} className="flex items-center gap-3">
            <span className={`size-3 flex-none rounded-full ${HUE_CLASS[c.color].solid}`} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{c.name}</span>
            <span className="tnum text-[13px] text-muted-foreground">{total ? Math.round((c.count / total) * 100) : 0}%</span>
            <span className="tnum w-8 text-right text-[14px] font-bold">{c.count}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
