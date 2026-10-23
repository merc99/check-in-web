import { cn } from '@/lib/utils'
import { HUE_CLASS, getTagHue, type Hue } from '@/lib/colors'

type Size = 's' | 'm' | 'l'
const SIZE: Record<Size, string> = {
  s: 'px-[10px] py-[3px] text-xs',
  m: 'px-3 py-[5px] text-[13px]',
  l: 'px-4 py-[9px] text-[15px]',
}
const base = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border font-medium leading-tight shadow-xs'

/** Static chip, filled with the tag's deterministic color (or `color`, e.g. a crew's). */
export function TagChip({
  name, size = 's', color, className,
}: { name: string; size?: Size; color?: Hue; className?: string }) {
  const c = HUE_CLASS[color ?? getTagHue(name)]
  return <span className={cn(base, SIZE[size], c.soft, c.ink, className)}>{name}</span>
}

/** Dashed "Add “name”" chip shown while typing a tag that doesn't exist yet. */
export function AddChip({ name, onAdd, size = 'm' }: { name: string; onAdd: () => void; size?: Size }) {
  const c = HUE_CLASS[getTagHue(name)]
  return (
    <button
      type="button"
      onClick={onAdd}
      className={cn(
        base, SIZE[size], c.soft, c.ink, 'border-dashed',
        'transition-[transform,box-shadow] duration-150 ease-out active:scale-[.96]',
      )}
    >
      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Add “{name}”
    </button>
  )
}

/** Selectable chip: white with a color dot, fills with the color when selected. */
export function ToggleChip({
  label, color, selected, onToggle, size = 'm',
}: { label: string; color?: Hue; selected: boolean; onToggle: () => void; size?: Size }) {
  const c = HUE_CLASS[color ?? getTagHue(label)]
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        base, SIZE[size],
        'transition-[transform,box-shadow,background-color] duration-200 ease-spring active:translate-y-px active:scale-[.96] active:shadow-none',
        selected ? cn(c.soft, c.ink, 'animate-bump') : 'bg-card text-foreground',
      )}
    >
      {!selected && <span className={cn('size-2.5 rounded-full border border-border', c.solid)} />}
      {label}
    </button>
  )
}
