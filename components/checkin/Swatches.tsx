import { cn } from '@/lib/utils'
import { HUE_CLASS, type Hue } from '@/lib/colors'

/** Row of round color picks. The chosen one gets a peach + ink ring and an ink dot. */
export function Swatches({
  colors, value, onChange,
}: { colors: readonly Hue[]; value: Hue; onChange: (c: Hue) => void }) {
  return (
    <div className="flex flex-wrap gap-[10px]">
      {colors.map((c) => {
        const selected = c === value
        return (
          <button
            key={c}
            type="button"
            aria-label={c}
            aria-pressed={selected}
            onClick={() => onChange(c)}
            className={cn(
              'grid size-[38px] place-items-center rounded-full border border-border transition-transform duration-200 ease-spring',
              HUE_CLASS[c].solid,
              selected ? 'scale-105 ring-2 ring-foreground ring-offset-2 ring-offset-background' : 'shadow-xs hover:-translate-y-0.5',
            )}
          >
            {selected && <span className="size-3 animate-bump rounded-full bg-foreground" />}
          </button>
        )
      })}
    </div>
  )
}
