'use client'

import { Flame } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Gloss, GlassInset, GlossPill, Sparkline } from '@/components/fx/Gloss'
import { RollingCount } from '@/components/fx/RollingCount'
import type { MyInsights, MyStats } from '@/lib/data'
import { addDays, localDate } from '@/lib/dates'
import { cn } from '@/lib/utils'

/**
 * The You scoreboard (pattern: mmo nodes stats panels): three glossy cards. All-time (the sacred
 * number) with 12 weeks of check-ins; the day streak with the last 14 days; the best streak with a
 * quiet bar of where you are against it. Digits roll up from 0 when the tab opens.
 */
export function StatsGrid({ stats, insights }: { stats: MyStats; insights?: MyInsights }) {
  // First paint shows 0, the next frame the real values, so every digit rolls into place.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  const n = (v: number) => (ready ? v : 0)

  const days = new Set(stats.days)
  const last14 = Array.from({ length: 14 }, (_, i) => localDate(addDays(new Date(), i - 13)))
  const change = insights ? insights.thisMonth - insights.lastMonth : 0

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 [--roll-ms:900ms] lg:grid-cols-[1.4fr_1fr_1fr]">
      <Gloss hue="primary" className="col-span-full rounded-xl p-5 lg:col-span-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <GlossPill>All time</GlossPill>
          {insights && (
            <GlossPill solid>
              <span className="tnum">{insights.thisMonth}</span> this month{change > 0 ? ` · +${change}` : ''}
            </GlossPill>
          )}
        </div>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div className="font-display text-[76px] leading-[.85] tracking-tightest">
            <RollingCount n={n(stats.total)} tight label={`${stats.total} check-ins, all time`} />
          </div>
          <p className="max-w-[17ch] pb-1 text-right text-[13px] font-semibold">check-ins, all time. This number never goes down.</p>
        </div>
        {insights && (
          <GlassInset className="mt-4 px-3 pb-2 pt-[10px]">
            <div className="flex items-baseline justify-between text-[12px] font-bold">
              <span>Last 12 weeks</span>
              <span className="opacity-70">this week</span>
            </div>
            <Sparkline
              values={insights.weeks}
              height={48}
              className="mt-1"
              label="Your check-ins per week, last 12 weeks"
              pointLabel={(i) => {
                const n = insights.weeks[i]
                const count = `${n} check-in${n === 1 ? '' : 's'}`
                if (i === insights.weeks.length - 1) return `This week · ${count}`
                const monday = addDays(new Date(), -((new Date().getDay() + 6) % 7) - (insights.weeks.length - 1 - i) * 7)
                return `Week of ${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${count}`
              }}
            />
          </GlassInset>
        )}
      </Gloss>

      <Gloss hue="clay" className="flex flex-col rounded-xl p-4">
        <GlossPill className="self-start">
          <Flame size={13} strokeWidth={2.25} aria-hidden="true" /> Day streak
        </GlossPill>
        <div className="mt-3 font-display text-[52px] leading-[.85] tracking-tightest">
          <RollingCount n={n(stats.streak)} tight label={`${stats.streak}-day streak`} />
        </div>
        <div className="mt-auto pt-4">
          <div className="grid grid-cols-7 gap-[3px]" aria-label="Last 14 days" role="img">
            {last14.map((d, i) => (
              <span
                key={d}
                title={`${i === 13 ? 'Today' : new Date(`${d}T12:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}: ${days.has(d) ? 'in' : 'not in'}`}
                className={cn(
                  'aspect-square rounded-[4px] transition-transform duration-150 ease-out [@media(hover:hover)]:hover:scale-125',
                  days.has(d) ? 'bg-on-color' : 'bg-white/35',
                  i === 13 && 'ring-2 ring-white',
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-[12px] font-semibold">Last 14 days</p>
        </div>
      </Gloss>

      <Gloss hue="grape" className="flex flex-col rounded-xl p-4">
        <GlossPill className="self-start">Best streak</GlossPill>
        <div className="mt-3 font-display text-[52px] leading-[.85] tracking-tightest">
          <RollingCount n={n(stats.best)} tight label={`Best streak ${stats.best} days`} />
        </div>
        <div className="mt-auto pt-4">
          <div className="h-[10px] overflow-hidden rounded-full bg-white/35" role="img" aria-label={`Current run ${stats.streak} of your best ${stats.best}`}>
            <span
              className="block h-full origin-left rounded-full bg-on-color transition-transform duration-300 ease-out"
              style={{ transform: `scaleX(${ready && stats.best ? Math.min(1, stats.streak / stats.best) : 0})` }}
            />
          </div>
          <p className="mt-2 text-[12px] font-semibold">{stats.streak >= stats.best ? 'You’re on your best run.' : 'Your longest run so far.'}</p>
        </div>
      </Gloss>
    </div>
  )
}
