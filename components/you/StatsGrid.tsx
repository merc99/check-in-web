'use client'

import { StatCard } from '@/components/checkin/StatCard'
import type { MyStats } from '@/lib/data'
import { useCountUp } from '@/lib/motion'

/** All-time count (big, mint), streak and best. Each rolls up from 0 when the tab opens, staggered. */
export function StatsGrid({ stats }: { stats: MyStats }) {
  const total = useCountUp(stats.total, { from: 0, duration: 900 })
  const streak = useCountUp(stats.streak, { from: 0, duration: 900, delay: 90 })
  const best = useCountUp(stats.best, { from: 0, duration: 900, delay: 180 })
  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      <StatCard big value={total} label="check-ins, all time. This number never goes down." />
      <StatCard value={streak} label="day streak" />
      <StatCard value={best} label="best streak" />
    </div>
  )
}
