import { cn } from '@/lib/utils'
import { CheckIcon } from './icons'

export interface HeatDay {
  label: string
  done: boolean
  today?: boolean
  future?: boolean
  /** Day of the month, shown under the pill. */
  date?: number
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** This week, Monday first. `isDone` decides which past days are checked. */
export function weekDays(isDone: (day: Date) => boolean, today = new Date()): HeatDay[] {
  const dow = (today.getDay() + 6) % 7
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dow + i)
    const future = i > dow
    return { label: 'MTWTFSS'[i], today: i === dow, future, done: !future && isDone(day), date: day.getDate() }
  })
}

/**
 * The week as a tally (the signature): seven tall pills, Mon–Sun, the day letter above and the date
 * below. In = mint with a check, and back-to-back days in are joined by a mint bridge (the streak
 * you can see). Open = a quiet well, still to come = faint hatching, today = a ring with its letter
 * and date in full ink. `animate` pops the checked pills in, staggered.
 */
export function HeatmapGrid({ days, animate }: { days: HeatDay[]; animate?: boolean }) {
  return (
    <ol className="grid grid-cols-7 gap-[6px]">
      {days.map((d, i) => {
        const state = d.done ? 'checked in' : d.future ? 'still to come' : d.today ? 'open today' : 'open'
        const joined = d.done && days[i + 1]?.done
        return (
          <li key={i} className="flex flex-col items-center gap-2">
            <span aria-hidden="true" className={cn('font-mono text-[11px] leading-none', d.today ? 'font-medium text-foreground' : 'text-subtle-foreground')}>
              {d.label}
            </span>
            <span className="relative w-full">
              {/* Two days in a row: a mint bridge through the gap to the next pill. */}
              {joined && (
                <span
                  aria-hidden="true"
                  className={cn('absolute left-1/2 top-1/2 h-[10px] w-[calc(100%+6px)] -translate-y-1/2 bg-primary', animate && 'animate-cellin')}
                  style={animate ? { animationDelay: `${i * 70 + 220}ms` } : undefined}
                />
              )}
              <span
                title={`${DAY_NAMES[i] ?? d.label}: ${state}`}
                className={cn(
                  'relative grid h-[52px] w-full place-items-center rounded-full',
                  d.done
                    ? 'bg-primary text-primary-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,white_45%,transparent),0_6px_14px_-8px_var(--primary)]'
                    : d.future
                      ? 'hatch opacity-60'
                      : 'bg-muted shadow-[inset_0_1px_2px_color-mix(in_oklab,black_18%,transparent)]',
                  d.today && !d.done && 'bg-card shadow-none ring-2 ring-foreground/70 ring-inset',
                  d.today && d.done && 'ring-2 ring-foreground/80 ring-offset-2 ring-offset-card',
                  animate && d.done && 'animate-cellin',
                )}
                style={animate && d.done ? { animationDelay: `${i * 70 + 150}ms` } : undefined}
              >
                {d.done && <CheckIcon size={16} />}
                {d.today && !d.done && <span aria-hidden="true" className="size-[6px] rounded-full bg-foreground/70" />}
                <span className="sr-only">
                  {DAY_NAMES[i] ?? d.label}: {state}
                </span>
              </span>
            </span>
            {d.date !== undefined && (
              <span aria-hidden="true" className={cn('tnum font-mono text-[11px] leading-none', d.today ? 'font-medium text-foreground' : 'text-subtle-foreground')}>
                {d.date}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
