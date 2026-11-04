'use client'

import { StackedBars, type StackedBar } from '@/components/bencho/StackedBars'
import type { MyInsights } from '@/lib/data'
import { HUE_CLASS } from '@/lib/colors'

const day = (iso: string) => new Date(`${iso}T12:00:00`)
const short = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/**
 * Your last 30 days (or 20 weeks) as stacked bars, one colour per crew (Bencho's stacked bars).
 * Shows where your days went lately; the crew share below it is all time.
 */
export function CrewDays({ insights }: { insights: MyInsights }) {
  const series = insights.byCrew.map((c) => ({ name: c.name, color: HUE_CLASS[c.color].cssVar }))
  const days: StackedBar[] = insights.daily.map((d) => {
    const s = short(day(d.date))
    return { vals: d.counts, label: s, short: s }
  })
  const weeks: StackedBar[] = insights.weekly.map((w) => {
    const from = day(w.start)
    const to = new Date(from)
    to.setDate(from.getDate() + 6)
    const label = from.getMonth() === to.getMonth() ? `${short(from)} – ${to.getDate()}` : `${short(from)} – ${short(to)}`
    return { vals: w.counts, label, short: short(from) }
  })
  return <StackedBars title="By crew" unit="check-ins" series={series} days={days} weeks={weeks} />
}
