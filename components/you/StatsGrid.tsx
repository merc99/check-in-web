'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/checkin/StatCard'
import { RollingCount } from '@/components/fx/RollingCount'
import type { MyStats } from '@/lib/data'

/**
 * All-time count (big, mint), streak and best. The digits roll up from 0 when the tab opens
 * (fx/RollingCount), so opening You feels like reading a scoreboard.
 */
export function StatsGrid({ stats }: { stats: MyStats }) {
  // First paint shows 0, the next frame the real values, so every digit rolls into place.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  const n = (v: number) => (ready ? v : 0)
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 [--roll-ms:900ms]">
      <StatCard big value={<RollingCount n={n(stats.total)} tight label={`${stats.total}`} />} label="check-ins, all time. This number never goes down." />
      <StatCard value={<RollingCount n={n(stats.streak)} tight label={`${stats.streak}`} />} label="day streak" />
      <StatCard value={<RollingCount n={n(stats.best)} tight label={`${stats.best}`} />} label="best streak" />
    </div>
  )
}
