'use client'

import { HUE_CLASS, type Hue } from '@/lib/colors'
import { getCrewChallenge, useQuery } from '@/lib/data'
import { cn } from '@/lib/utils'

/**
 * This month's crew challenge (mastery): one shared session target, the crew's progress toward it.
 * Together, never a countdown: no days-left, no "hurry".
 */
export function ChallengeBar({ groupId, color, className, onColor }: { groupId: string; color: Hue; className?: string; onColor?: boolean }) {
  const c = useQuery(() => getCrewChallenge(groupId), [groupId], ['check_ins', 'group_members'])
  if (!c.data) return null
  const { month, target, done } = c.data
  const pct = Math.min(100, Math.round((done / target) * 100))
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span>
          <span className="font-semibold">{month} challenge</span>{' '}
          <span className={onColor ? 'opacity-75' : 'text-muted-foreground'}>{target} sessions together</span>
        </span>
        <span className="tnum font-semibold">{done >= target ? 'Done' : `${pct}%`}</span>
      </div>
      <div aria-hidden="true" className={cn('mt-2 h-2 overflow-hidden rounded-full', onColor ? 'bg-black/10' : 'bg-muted')}>
        <div className={cn('h-full origin-left rounded-full transition-transform duration-300 ease-out', onColor ? 'bg-on-color' : HUE_CLASS[color].solid)} style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
      <span className="sr-only">{`${done} of ${target} sessions this month`}</span>
    </div>
  )
}
