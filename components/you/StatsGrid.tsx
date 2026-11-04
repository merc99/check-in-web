'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Sparkline } from '@/components/fx/Gloss'
import { RollingCount } from '@/components/fx/RollingCount'
import type { MyInsights, MyStats } from '@/lib/data'
import { addDays, localDate } from '@/lib/dates'
import { cn } from '@/lib/utils'

/**
 * The You scoreboard (references: Data API stat cards, Crextio, Chattery Echo). One hero card with the
 * all-time count (the sacred number), its change against last month and the main chart (12 weeks);
 * then four number tiles. Numbers only in the tiles: a label, a big figure, what it compares to.
 * Digits roll up from 0 when the tab opens.
 */
export function StatsGrid({ stats, insights }: { stats: MyStats; insights?: MyInsights }) {
  // First paint shows 0, the next frame the real values, so every digit rolls into place.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  const n = (v: number) => (ready ? v : 0)

  // This week so far, Monday first.
  const today = new Date()
  const dow = (today.getDay() + 6) % 7
  const days = new Set(stats.days)
  const thisWeek = Array.from({ length: dow + 1 }, (_, i) => localDate(addDays(today, i - dow))).filter((d) => days.has(d)).length
  const change = insights ? insights.thisMonth - insights.lastMonth : 0

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 [--roll-ms:900ms] lg:grid-cols-4">
      <section aria-label="All time" className="col-span-full rounded-xl border bg-card p-5 edge-lit lg:col-span-2 lg:row-span-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[14px] font-normal tracking-normal text-muted-foreground">All time</h2>
          {insights && (
            change > 0 ? (
              <span className="rounded-full bg-primary-soft px-2 py-[3px] font-mono text-[12px] text-primary-ink">+{change} vs last month</span>
            ) : (
              <span className="font-mono text-[12px] text-muted-foreground">
                <span className="tnum">{insights.thisMonth}</span> this month
              </span>
            )
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-[64px] font-medium leading-none tracking-tightest">
            <RollingCount n={n(stats.total)} tight label={`${stats.total} check-ins, all time`} />
          </span>
          <span className="text-[15px] text-muted-foreground">check-ins</span>
        </div>
        <p className="mt-2 text-[13px] text-muted-foreground">This number never goes down</p>
        {insights && (
          <div className="mt-5">
            <Sparkline
              values={insights.weeks}
              height={104}
              className="text-primary"
              label="Your check-ins per week, last 12 weeks"
              pointLabel={(i) => {
                const v = insights.weeks[i]
                const count = `${v} check-in${v === 1 ? '' : 's'}`
                if (i === insights.weeks.length - 1) return `This week · ${count}`
                const monday = addDays(new Date(), -((new Date().getDay() + 6) % 7) - (insights.weeks.length - 1 - i) * 7)
                return `${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${count}`
              }}
            />
            <div aria-hidden="true" className="mt-2 flex justify-between font-mono text-[12px] text-subtle-foreground">
              <span>12 weeks ago</span>
              <span>this week</span>
            </div>
          </div>
        )}
      </section>

      <Tile label="Day streak" value={<RollingCount n={n(stats.streak)} tight label={`${stats.streak}-day streak`} />} unit="days">
        {stats.streak > 0 && stats.streak >= stats.best ? 'Your best run' : `best ${stats.best}`}
      </Tile>
      <Tile label="Best streak" value={<RollingCount n={n(stats.best)} tight label={`Best streak ${stats.best} days`} />} unit="days">
        longest so far
      </Tile>
      <Tile label="This week" value={<RollingCount n={n(thisWeek)} tight label={`${thisWeek} of 7 days this week`} />} unit="/7">
        {stats.checkedInToday ? 'in today' : 'today open'}
      </Tile>
      {insights && (
        <Tile label="This month" value={<RollingCount n={n(insights.thisMonth)} tight label={`${insights.thisMonth} check-ins this month`} />} unit="check-ins">
          vs <span className="tnum">{insights.lastMonth}</span> last month
        </Tile>
      )}
    </div>
  )
}

/** A number tile: label, big figure with a small muted unit, one muted line of comparison. */
function Tile({ label, value, unit, children }: { label: string; value: ReactNode; unit: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="flex flex-col rounded-xl border bg-card p-4 edge-lit">
      <h2 className="text-[13px] font-normal tracking-normal text-muted-foreground">{label}</h2>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-[32px] font-medium leading-none tracking-tighter">{value}</span>
        <span className={cn('text-[13px] text-muted-foreground', unit.startsWith('/') && 'tnum')}>{unit}</span>
      </p>
      <p className="mt-auto pt-3 font-mono text-[12px] text-subtle-foreground">{children}</p>
    </section>
  )
}
