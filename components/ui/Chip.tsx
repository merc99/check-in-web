import { cn } from '@/lib/cn'
import { COLOR_CLASS, getTagColor, type BrandColor } from '@/lib/colors'

type Size = 's' | 'm' | 'l'
const SIZE: Record<Size, string> = {
  s: 'px-[10px] py-[3px] text-xs',
  m: 'px-3 py-[5px] text-[13px]',
  l: 'px-4 py-[9px] text-[15px]',
}
const base = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-ink font-medium leading-tight shadow-sh1'

/** Static tag chip, filled with the tag's deterministic color. */
export function TagChip({ name, size = 's', className }: { name: string; size?: Size; className?: string }) {
  const c = COLOR_CLASS[getTagColor(name)]
  return <span className={cn(base, SIZE[size], c.bg, c.text, className)}>{name}</span>
}

/** Selectable chip: white with a color dot, fills with the color when selected. */
export function ToggleChip({
  label, color, selected, onToggle, size = 'm',
}: { label: string; color?: BrandColor; selected: boolean; onToggle: () => void; size?: Size }) {
  const c = COLOR_CLASS[color ?? getTagColor(label)]
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        base, SIZE[size],
        'transition-[transform,box-shadow,background-color] duration-200 ease-spring active:translate-y-px active:scale-[.96] active:shadow-sh1-pressed',
        selected ? cn(c.bg, c.text, 'animate-bump') : 'bg-card text-ink',
      )}
    >
      {!selected && <span className={cn('size-2.5 rounded-full border border-ink', c.bg)} />}
      {label}
    </button>
  )
}
