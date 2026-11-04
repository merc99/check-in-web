'use client'

import type { MyInsights, MyStats } from '@/lib/data'
import { addDays, localDate } from '@/lib/dates'
import { cn } from '@/lib/utils'

const WEEKS = 20
const ROW_LABEL = ['M', '', 'W', '', 'F', '', '']

/**
 * The last 20 weeks as a mosaic (one square per day, Monday on top): mint where you showed up, a quiet
 * well where you didn't, faint hatching for the rest of this week, today ringed. Month names sit over
 * the week each month starts in. A count of days in, and this month against the last.
 * Squares fade in column by column when You opens (opacity only).
 */
export function ShowingUp({ stats, insights }: { stats: MyStats; insights?: MyInsights }) {
  const today = new Date()
  const todayKey = localDate(today)
  const dow = (today.getDay() + 6) % 7
  const start = addDays(today, -dow - (WEEKS - 1) * 7) // the Monday 19 weeks before this one
  const inDays = new Set(stats.days)

  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(start, w * 7 + d)
      const key = localDate(day)
      return { day, key, future: key > todayKey, today: key === todayKey, done: inDays.has(key) }
    }),
  )
  // A month's name over the week it starts in; the first column names its month only when the next
  // month doesn't start within three weeks (so two names never collide).
  const starts = weeks.map((w) => w.find((c) => c.day.getDate() === 1)?.day ?? null)
  const nextStart = starts.findIndex((d, i) => i > 0 && d)
  const monthLabels = starts.map((d, i) => (i === 0 ? (nextStart === -1 || nextStart > 3 ? weeks[0][0].day : null) : d))
  const shown = weeks.flat().filter((c) => !c.future)
  const count = shown.filter((c) => c.done).length
  const change = insights ? insights.thisMonth - insights.lastMonth : 0

  return (
    <section aria-label="Showing up, last 20 weeks" className="mt-3 flex flex-col rounded-xl border bg-card p-5 edge-lit">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-medium leading-none">Showing up</h2>
        {insights && change > 0 && (
          <span className="rounded-full bg-primary-soft px-2 py-1 font-mono text-[12px] text-primary-ink">+{change} vs last month</span>
        )}
      </div>
      <p className="mt-2 text-[13px] text-muted-foreground">
        <span className="tnum font-medium text-foreground">{count}</span> of <span className="tnum">{shown.length}</span> days in, last 20 weeks
      </p>

      <div aria-hidden="true" className="mt-4 grid grid-cols-[auto_1fr] gap-x-2">
        <span />
        {/* Month names over the column where each month starts. */}
        <div className="grid h-4 grid-cols-[repeat(20,minmax(0,1fr))] gap-[3px] font-mono text-[11px] leading-none text-subtle-foreground">
          {weeks.map((w, i) => {
            const label = monthLabels[i]
            return (
              <span key={i} className="relative">
                {label && <span className="absolute left-0 top-0 whitespace-nowrap">{label.toLocaleDateString(undefined, { month: 'short' })}</span>}
              </span>
            )
          })}
        </div>

        <div className="grid grid-rows-7 gap-[3px] pr-0.5 font-mono text-[10px] leading-none text-subtle-foreground">
          {ROW_LABEL.map((l, i) => (
            <span key={i} className="flex items-center">{l}</span>
          ))}
        </div>
        <div className="grid grid-flow-col grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-7 gap-[3px]">
          {weeks.map((w, wi) =>
            w.map((c) => (
              <span
                key={c.key}
                title={`${c.day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}: ${c.done ? 'in' : c.future ? 'still to come' : 'open'}`}
                className={cn(
                  'aspect-square rounded-[3px] animate-rise [animation-duration:240ms]',
                  c.done ? 'bg-primary' : c.future ? 'hatch opacity-50' : 'bg-muted',
                  c.today && 'ring-2 ring-foreground/70 ring-offset-1 ring-offset-card',
                )}
                style={{ animationDelay: `${wi * 18}ms` }}
              />
            )),
          )}
        </div>
      </div>

      {insights && (
        <div className="mt-4 flex items-baseline justify-between gap-3 border-t pt-3 font-mono text-[12px] text-muted-foreground lg:mt-auto">
          <span>
            <span className="tnum text-foreground">{insights.thisMonth}</span> this month
          </span>
          <span>
            <span className="tnum text-foreground">{insights.lastMonth}</span> last month
          </span>
        </div>
      )}
    </section>
  )
}
