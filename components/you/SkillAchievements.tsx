'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import { getSkillAchievements, useQuery } from '@/lib/data'
import { cn } from '@/lib/utils'

/**
 * A skill's achievements (mastery): "9 of 17", then a grid of small goals when opened. Unlocked ones
 * are filled in the crew's color; the rest show how far along they are. Obtainable first.
 */
export function SkillAchievements({ groupId, color }: { groupId: string; color: Hue }) {
  const [open, setOpen] = useState(false)
  const panel = useId()
  const list = useQuery(() => getSkillAchievements(groupId), [groupId], ['check_ins'])
  const items = list.data ?? []
  if (!items.length) return null
  const done = items.filter((a) => a.unlocked).length
  const hue = HUE_CLASS[color]
  return (
    <div className="px-1 pt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen((o) => !o)}
        className="hit-44 flex w-full items-center justify-between gap-3 text-left text-[13px]"
      >
        <span>
          <span className="font-semibold">Achievements</span>{' '}
          <span className="tnum text-muted-foreground">
            {done} of {items.length}
          </span>
        </span>
        <ChevronDown size={16} className={cn('flex-none text-muted-foreground transition-transform duration-200 ease-out', open && 'rotate-180')} aria-hidden="true" />
      </button>
      <div id={panel} className={cn('grid transition-[grid-template-rows] duration-200 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')} inert={!open}>
        <ul className="grid min-h-0 grid-cols-2 gap-2 overflow-hidden pt-3 sm:grid-cols-3">
          {items.map((a) => (
            <li
              key={a.key}
              className={cn('rounded-md border p-[10px] text-[12.5px]', a.unlocked ? cn(hue.soft, 'border-transparent') : 'border-dashed border-border-strong')}
            >
              <span className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className={cn('mt-px grid size-5 flex-none place-items-center rounded-full', a.unlocked ? cn(hue.solid, 'text-on-color') : 'border border-border-strong')}
                >
                  {a.unlocked && <Check size={12} strokeWidth={2.5} />}
                </span>
                <span className="min-w-0">
                  <span className={cn('block font-semibold leading-tight', a.unlocked ? hue.ink : 'text-foreground')}>{a.title}</span>
                  <span className="block text-[12px] text-muted-foreground">{a.subtitle}</span>
                </span>
              </span>
              {!a.unlocked && a.progress && (
                <span aria-hidden="true" className="mt-2 block h-1 overflow-hidden rounded-full bg-muted">
                  <span className={cn('block h-full rounded-full', hue.solid)} style={{ width: `${(a.progress.n / a.progress.of) * 100}%` }} />
                </span>
              )}
              <span className="sr-only">{a.unlocked ? 'Unlocked' : a.progress ? `${a.progress.n} of ${a.progress.of}` : 'Not yet'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
