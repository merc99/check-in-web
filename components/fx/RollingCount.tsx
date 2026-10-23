import { cn } from '@/lib/utils'
import styles from './RollingCount.module.css'

const DIGITS = '0123456789'.split('')

/**
 * A number whose digits roll like an odometer (pattern: Bencho / Emoji reactions, MIT).
 * Columns are keyed from the right, so 9 → 10 adds a column on the left instead of reshuffling.
 * - In chips (reactions), the chip's own label says the number: leave `label` off.
 * - On its own (stats, the crew hero), pass `label` so screen readers hear the value once.
 * `tight` sets each row to 1em, for display numbers with tight leading.
 */
export function RollingCount({ n, label, tight, className }: { n: number; label?: string; tight?: boolean; className?: string }) {
  const s = String(Math.max(0, n))
  return (
    <span className={cn(styles.count, tight && styles.tight, className)}>
      <span aria-hidden="true" className={styles.digits}>
        {s.split('').map((d, i) => (
          <span key={s.length - i} className={styles.col}>
            <span className={styles.strip} style={{ transform: `translateY(calc(${-Number(d)} * var(--roll-h)))` }}>
              {DIGITS.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </span>
          </span>
        ))}
      </span>
      {label !== undefined && <span className="sr-only">{label}</span>}
    </span>
  )
}
