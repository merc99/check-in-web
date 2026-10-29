'use client'

import { X } from 'lucide-react'
import { useId, useState } from 'react'
import { Input } from '@/components/checkin/FormField'
import { DETAIL_FIELDS, type CheckInDetails, type SkillKind } from '@/lib/mastery'
import { cn } from '@/lib/utils'

const ACTIVITIES = ['Run', 'Walk', 'Ride', 'Strength', 'Yoga', 'Swim']
const MINUTES = [15, 30, 45, 60, 90]
const ITEMS_HINT: Partial<Record<SkillKind, string>> = { music: 'A song or exercise, then Enter', art: 'A medium or piece, then Enter' }

/**
 * The optional specifics of a session, in the check-in sheet. Which fields show depends on the
 * crew's skill (lib/mastery DETAIL_FIELDS). Everything is optional; loose check-ins are fine.
 */
export function DetailsEditor({ skill, value, onChange }: { skill: SkillKind; value: CheckInDetails; onChange: (next: CheckInDetails) => void }) {
  const fields = DETAIL_FIELDS[skill]
  const [item, setItem] = useState('')
  const ids = { minutes: useId(), distance: useId(), book: useId(), pages: useId(), items: useId(), activity: useId() }
  const set = (patch: Partial<CheckInDetails>) => onChange({ ...value, ...patch })
  const num = (s: string) => (s === '' ? undefined : Math.max(0, Number(s)))
  const addItem = () => {
    const v = item.trim()
    if (!v) return
    set({ items: [...(value.items ?? []), v].slice(0, 6) })
    setItem('')
  }

  return (
    <div className="flex flex-col gap-4">
      {fields.includes('activity') && (
        <div role="group" aria-labelledby={ids.activity}>
          <p id={ids.activity} className="mb-2 text-[13px] font-semibold">Activity</p>
          <div className="flex flex-wrap gap-2">
            {ACTIVITIES.map((a) => (
              <Choice key={a} on={value.activity === a} onClick={() => set({ activity: value.activity === a ? undefined : a })}>
                {a}
              </Choice>
            ))}
          </div>
        </div>
      )}

      {fields.includes('minutes') && (
        <div>
          <label htmlFor={ids.minutes} className="mb-2 block text-[13px] font-semibold">Time</label>
          <div className="flex flex-wrap items-center gap-2">
            {MINUTES.map((m) => (
              <Choice key={m} on={value.minutes === m} onClick={() => set({ minutes: value.minutes === m ? undefined : m })}>
                {m} min
              </Choice>
            ))}
            <span className="inline-flex items-center gap-2">
              <Input
                id={ids.minutes}
                type="number"
                inputMode="numeric"
                min={1}
                max={1440}
                value={value.minutes && !MINUTES.includes(value.minutes) ? value.minutes : ''}
                onChange={(e) => set({ minutes: num(e.target.value) })}
                placeholder="Other"
                className="h-9 w-[88px] py-1"
              />
              <span className="text-[13px] text-muted-foreground">min</span>
            </span>
          </div>
        </div>
      )}

      {fields.includes('distanceKm') && (
        <div>
          <label htmlFor={ids.distance} className="mb-2 block text-[13px] font-semibold">Distance</label>
          <span className="inline-flex items-center gap-2">
            <Input
              id={ids.distance}
              type="number"
              inputMode="decimal"
              step="0.1"
              min={0}
              value={value.distanceKm ?? ''}
              onChange={(e) => set({ distanceKm: num(e.target.value) })}
              className="h-10 w-[110px] py-1"
            />
            <span className="text-[13px] text-muted-foreground">km</span>
          </span>
        </div>
      )}

      {fields.includes('book') && (
        <div>
          <label htmlFor={ids.book} className="mb-2 block text-[13px] font-semibold">Book</label>
          <Input id={ids.book} value={value.book ?? ''} maxLength={80} onChange={(e) => set({ book: e.target.value })} />
        </div>
      )}

      {fields.includes('pages') && (
        <div>
          <label htmlFor={ids.pages} className="mb-2 block text-[13px] font-semibold">Pages</label>
          <Input
            id={ids.pages}
            type="number"
            inputMode="numeric"
            min={1}
            value={value.pages ?? ''}
            onChange={(e) => set({ pages: num(e.target.value) })}
            className="h-10 w-[110px] py-1"
          />
        </div>
      )}

      {fields.includes('items') && (
        <div>
          <label htmlFor={ids.items} className="mb-2 block text-[13px] font-semibold">
            {skill === 'music' ? 'What you worked on' : 'Pieces'}
          </label>
          {!!value.items?.length && (
            <ul className="mb-2 flex flex-wrap gap-2">
              {value.items.map((it, i) => (
                <li key={`${it}-${i}`} className="inline-flex h-8 items-center gap-1 rounded-full border border-border-strong bg-card pl-3 pr-1 text-[13px] font-medium">
                  {it}
                  <button
                    type="button"
                    aria-label={`Remove ${it}`}
                    onClick={() => set({ items: value.items?.filter((_, j) => j !== i) })}
                    className="hit-44 grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Input
            id={ids.items}
            value={item}
            maxLength={40}
            onChange={(e) => setItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addItem()
              }
            }}
            onBlur={addItem}
            placeholder={ITEMS_HINT[skill] ?? 'Add one, then Enter'}
          />
        </div>
      )}
    </div>
  )
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'hit-44 inline-flex h-9 items-center rounded-full border px-3 text-[13px] font-semibold transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[.96]',
        on ? 'border-primary bg-primary-soft text-primary-ink' : 'border-border-strong bg-card hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}
