import { cn } from '@/lib/cn'
import { COLOR_CLASS, type BrandColor } from '@/lib/colors'

/** Row of round color picks. The chosen one gets a peach + ink ring and an ink dot. */
export function Swatches({
  colors, value, onChange,
}: { colors: readonly BrandColor[]; value: BrandColor; onChange: (c: BrandColor) => void }) {
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
              'grid size-[38px] place-items-center rounded-full border border-ink transition-transform duration-200 ease-spring',
              COLOR_CLASS[c].bg,
              selected ? 'scale-105 shadow-selected' : 'shadow-sh1 hover:-translate-y-0.5',
            )}
          >
            {selected && <span className="size-3 animate-bump rounded-full bg-ink" />}
          </button>
        )
      })}
    </div>
  )
}
