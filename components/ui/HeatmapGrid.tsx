import { cn } from '@/lib/cn'
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
 * Seven cells, Mon–Sun. Checked = mint + check, open = peach-deep, future = dimmed, today = ink outline.
 * `animate` pops the checked cells in, staggered. Change the component's `key` to replay it.
 */
export function HeatmapGrid({ days, animate }: { days: HeatDay[]; animate?: boolean }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d, i) => (
        <div key={i}>
          <div
            className={cn(
              'grid aspect-square place-items-center rounded-input border',
              d.done ? 'border-ink bg-mint shadow-sh1' : 'border-rule bg-peach-deep',
              d.today && 'outline outline-[2.5px] outline-offset-2 outline-ink',
              d.future && 'opacity-45',
              animate && d.done && 'animate-cellin',
            )}
            style={animate && d.done ? { animationDelay: `${i * 70 + 150}ms` } : undefined}
          >
            {d.done && <CheckIcon size={16} />}
            <span className="sr-only">
              {DAY_NAMES[i] ?? d.label}: {d.done ? 'checked in' : d.future ? 'still to come' : 'open'}
            </span>
          </div>
          <div aria-hidden="true" className="mt-2 text-center text-[11.5px] font-bold text-ink-soft">
            {d.label}
          </div>
        </div>
      ))}
    </div>
  )
}
