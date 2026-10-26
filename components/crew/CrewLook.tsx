'use client'

import { CrewCover } from '@/components/checkin/CrewCover'
import { CrewSurface } from '@/components/checkin/CrewSurface'
import { Swatches } from '@/components/checkin/Swatches'
import { CREW_HUES, HUE_CLASS, type Hue } from '@/lib/colors'
import { CREW_EMOJI, CREW_PATTERNS, PATTERN_LABEL, type CrewPattern } from '@/lib/crewStyle'
import { cn } from '@/lib/utils'

export interface CrewLookValue {
  color: Hue
  emoji: string | null
  pattern: CrewPattern
}

/**
 * Crew settings: how the crew looks everywhere (feed banner, Explore card, crew lists). A live
 * preview, then color, emoji and cover pattern. Each pick saves right away (`onChange`).
 */
export function CrewLook({ name, value, onChange }: { name: string; value: CrewLookValue; onChange: (patch: Partial<CrewLookValue>) => void }) {
  const hue = HUE_CLASS[value.color]
  const letter = (name.trim()[0] ?? '?').toUpperCase()
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {/* Preview: the banner as the feed shows it. */}
      <CrewSurface hue={value.color} className="flex items-center gap-3 p-4 shadow-none!" aria-hidden="true">
        <span className="relative min-w-0 flex-1 truncate font-display text-[26px] font-extrabold leading-none tracking-tighter">{name}</span>
      </CrewSurface>

      <div className="flex flex-col gap-5 p-4">
        <fieldset>
          <legend className="mb-3 text-sm font-bold">Color</legend>
          <Swatches colors={CREW_HUES} value={value.color} onChange={(color) => onChange({ color })} />
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-sm font-bold">Emoji</legend>
          <div className="flex flex-wrap gap-2">
            <Pick selected={value.emoji === null} onClick={() => onChange({ emoji: null })} label={`First letter, ${letter}`}>
              <span className="font-display text-[17px]">{letter}</span>
            </Pick>
            {CREW_EMOJI.map((e) => (
              <Pick key={e} selected={value.emoji === e} onClick={() => onChange({ emoji: e })} label={e}>
                <span className="text-[19px] leading-none">{e}</span>
              </Pick>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-sm font-bold">Cover pattern</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {CREW_PATTERNS.map((p) => {
              const selected = value.pattern === p
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ pattern: p })}
                  className={cn(
                    'group overflow-hidden rounded-md border text-left transition-[transform,border-color] duration-150 ease-out active:scale-[.97]',
                    selected ? 'border-foreground ring-2 ring-foreground/20' : 'border-border hover:border-border-strong',
                  )}
                >
                  <span className={cn('relative block h-11', hue.solid)}>
                    <CrewCover pattern={p} className="text-on-color opacity-25" fade={false} />
                  </span>
                  <span className="block px-2 py-[6px] text-[12.5px] font-semibold">{PATTERN_LABEL[p]}</span>
                </button>
              )
            })}
          </div>
        </fieldset>
      </div>
    </div>
  )
}

function Pick({ selected, onClick, label, children }: { selected: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'grid size-11 place-items-center rounded-md border transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[.94]',
        selected ? 'border-foreground bg-muted' : 'border-border bg-card hover:-translate-y-0.5 hover:border-border-strong',
      )}
    >
      {children}
    </button>
  )
}
