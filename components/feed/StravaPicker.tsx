'use client'

import { Check } from 'lucide-react'
import { formatMinutes } from '@/components/checkin/SessionDetails'
import { Button } from '@/components/ui/button'
import { getStravaActivities, useQuery, type StravaActivity } from '@/lib/data'
import { PREF, usePref } from '@/lib/prefs'
import { timeAgo } from '@/lib/dates'
import { useNow } from '@/lib/useNow'
import { cn } from '@/lib/utils'

/**
 * Pick a recent Strava activity for a fitness check-in (demo: sample activities, no account).
 * Not connected yet: one button connects the demo. Picking fills the session's details.
 */
export function StravaPicker({ pickedId, onPick }: { pickedId: string | null; onPick: (a: StravaActivity | null) => void }) {
  const [connected, setConnected] = usePref(PREF.strava)
  const activities = useQuery(() => (connected ? getStravaActivities() : Promise.resolve([])), [connected], [])
  const now = useNow()

  if (!connected) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 text-[13px] text-muted-foreground">Pick a recent run, walk or ride from Strava. In this demo, no account is needed.</p>
        <Button size="sm" variant="secondary" onClick={() => setConnected(true)}>
          Connect Strava
        </Button>
      </div>
    )
  }

  return (
    <div role="radiogroup" aria-label="Recent Strava activities" className="flex flex-col gap-2">
      {activities.data?.map((a) => {
        const on = a.id === pickedId
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onPick(on ? null : a)}
            className={cn(
              'flex items-center gap-3 rounded-md border px-3 py-[10px] text-left transition-colors duration-150 ease-out',
              on ? 'border-primary bg-primary-soft/50' : 'border-border-strong bg-card hover:bg-muted',
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold">{a.name}</span>
              <span className="tnum block text-[12.5px] text-muted-foreground">
                {a.distanceKm} km, {formatMinutes(a.minutes)}, {timeAgo(a.startedAt, now)}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={cn('grid size-6 flex-none place-items-center rounded-full border', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong')}
            >
              {on && <Check size={14} strokeWidth={2.5} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
