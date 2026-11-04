import type { ReactNode } from 'react'
import { Card } from './Card'

/**
 * A number and what it counts. `big` spans the row, for the all-time count.
 * Use inside `grid grid-cols-2 gap-3`.
 */
export function StatCard({ value, label, big }: { value: ReactNode; label: ReactNode; big?: boolean }) {
  return big ? (
    <Card className="col-span-full p-5">
      <div className="tnum text-[56px] font-medium leading-none tracking-tightest">{value}</div>
      <div className="mt-2 text-[13px] text-muted-foreground">{label}</div>
    </Card>
  ) : (
    <Card>
      <div className="tnum text-[32px] font-medium leading-none tracking-tighter">{value}</div>
      <div className="mt-2 text-[13px] text-muted-foreground">{label}</div>
    </Card>
  )
}
