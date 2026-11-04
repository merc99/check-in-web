import { cn } from '@/lib/utils'
import { CheckIcon } from './icons'

export interface HeatDay {
  label: string
  done: boolean
  today?: boolean
  future?: boolean
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** This week, Monday first. `isDone` decides which past days are checked. */
export function weekDays(isDone: (day: Date) => boolean, today = new Date()): HeatDay[] {
  const dow = (today.getDay() + 6) % 7
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dow + i)
    const future = i > dow
    return { label: 'MTWTFSS'[i], today: i === dow, future, done: !future && isDone(day) }
  })
}

/**
 * The week as a tally (the signature): seven pills, Mon–Sun. In = mint with a check, open = muted,
 * still to come = hatched, today = a ring. `animate` pops the checked pills in, staggered.
 */
export function HeatmapGrid({ days, animate }: { days: HeatDay[]; animate?: boolean }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d, i) => (
        <div key={i}>
          <div
            title={`${DAY_NAMES[i] ?? d.label}: ${d.done ? 'checked in' : d.future ? 'still to come' : 'open'}`}
            className={cn(
              'grid h-11 place-items-center rounded-full border',
              d.done ? 'border-transparent bg-primary text-primary-foreground' : d.future ? 'hatch border-dashed border-border-strong' : 'border-border bg-muted',
              d.today && 'outline-solid outline-2 outline-offset-2 outline-foreground/60',
              animate && d.done && 'animate-cellin',
            )}
            style={animate && d.done ? { animationDelay: `${i * 70 + 150}ms` } : undefined}
          >
            {d.done && <CheckIcon size={16} />}
            <span className="sr-only">
              {DAY_NAMES[i] ?? d.label}: {d.done ? 'checked in' : d.future ? 'still to come' : 'open'}
            </span>
          </div>
          <div aria-hidden="true" className="mt-2 text-center font-mono text-[12px] text-muted-foreground">
            {d.label}
          </div>
        </div>
      ))}
    </div>
  )
}
