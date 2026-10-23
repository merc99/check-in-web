import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Card } from './Card'

/**
 * A number and what it counts. `big` spans the row in mint, for the all-time count.
 * Use inside `grid grid-cols-2 gap-3`.
 */
export function StatCard({ value, label, big }: { value: ReactNode; label: ReactNode; big?: boolean }) {
  return big ? (
    <Card className="col-span-full flex items-end justify-between gap-4 bg-mint p-5">
      <div className="tnum font-display text-[76px] leading-[.85]">{value}</div>
      <div className="max-w-[18ch] text-right text-[13px] font-medium">{label}</div>
    </Card>
  ) : (
    <Card>
      <div className={cn('tnum font-display text-4xl leading-none')}>{value}</div>
      <div className="mt-2 text-[13px] text-ink-soft">{label}</div>
    </Card>
  )
}
