'use client'

import { Check } from 'lucide-react'
import { useState } from 'react'
import { BadgeDisc } from '@/components/checkin/Progression'
import { useToast } from '@/components/checkin/Toast'
import { setLoadout, type MyProgress } from '@/lib/data'
import { REWARDS, XP } from '@/lib/progression'
import { cn } from '@/lib/utils'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'earned', label: 'Earned' },
  { value: 'next', label: 'In progress' },
] as const
type Filter = (typeof FILTERS)[number]['value']

const COLLAPSED = 9

/**
 * Every badge you can earn (progression), account-wide and per skill. Earned ones are coins in their
 * color; tap one to show it on your check-in card. The rest show how far along you are and what they
 * unlock (a title, sometimes). Each one is +25 XP.
 */
export function BadgeWall({ progress: p }: { progress: MyProgress }) {
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  const [all, setAll] = useState(false)
  const list = p.badges.filter((b) => (filter === 'earned' ? b.unlocked : filter === 'next' ? !b.unlocked && !!b.progress && b.progress.n > 0 : true))
  const shown = all ? list : list.slice(0, COLLAPSED)

  const show = (key: string, name: string) => {
    const on = p.loadout.badge !== key
    setLoadout({ badge: on ? key : null }).then(
      () => toast(on ? `${name} is on your check-in card` : 'Badge off your card'),
      (e: unknown) => toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.'),
    )
  }

  return (
    <div className="rounded-xl border bg-card p-4 edge-lit">
      <div role="group" aria-label="Show badges" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'h-8 flex-none rounded-full px-3 text-[13px] font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[.97]',
              filter === f.value ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 lg:grid-cols-3">
        {shown.map((b) => {
          const worn = p.loadout.badge === b.key
          const unlocks = REWARDS.find((r) => r.unlock.kind === 'achievement' && r.unlock.key === (b.key.startsWith('all.') ? b.key.slice(4) : b.key.split(':')[1]))
          const body = (
            <>
              <span className="relative">
                <BadgeDisc badgeKey={b.key} locked={!b.unlocked} size="lg" />
                {worn && (
                  <span aria-hidden="true" className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-foreground text-background ring-2 ring-card">
                    <Check size={12} strokeWidth={2.5} />
                  </span>
                )}
              </span>
              <span className="mt-2 block text-[13px] font-medium leading-tight">{b.name}</span>
              <span className="mt-0.5 block text-[12px] leading-tight text-muted-foreground">{b.crewName ?? 'Any crew'}</span>
              {!b.unlocked && b.progress && (
                <span aria-hidden="true" className="mt-2 block h-1 w-14 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full origin-left rounded-full bg-foreground/60" style={{ transform: `scaleX(${b.progress.n / b.progress.of})` }} />
                </span>
              )}
              <span className="mt-1.5 block font-mono text-[11px] leading-tight text-subtle-foreground">
                {b.unlocked ? (worn ? 'On your card' : `+${XP.achievement} XP`) : b.progress ? `${b.progress.n.toLocaleString()} / ${b.progress.of.toLocaleString()}` : b.subtitle}
              </span>
              {unlocks && <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">Title: {unlocks.name}</span>}
            </>
          )
          return (
            <li key={b.key} className="flex flex-col items-center text-center">
              {b.unlocked ? (
                <button
                  type="button"
                  aria-pressed={worn}
                  aria-label={`${b.name}${b.crewName ? `, ${b.crewName}` : ''}. ${worn ? 'On your card' : 'Show on your card'}`}
                  onClick={() => show(b.key, b.name)}
                  className="flex flex-col items-center rounded-lg p-1 transition-transform duration-150 ease-out active:scale-[.97]"
                >
                  {body}
                </button>
              ) : (
                <div className="flex flex-col items-center p-1" aria-label={`${b.name}, not earned yet: ${b.subtitle}`}>
                  {body}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {list.length > COLLAPSED && (
        <button type="button" onClick={() => setAll((a) => !a)} className="hit-44 mt-4 w-full border-t pt-3 text-[13px] font-medium text-muted-foreground hover:text-foreground">
          {all ? 'Show fewer' : `Show all ${list.length}`}
        </button>
      )}
    </div>
  )
}
