import { cn } from '@/lib/utils'
import { HUE_CLASS, getTagHue, type Hue } from '@/lib/colors'

type Size = 's' | 'm'
const SIZE: Record<Size, string> = { s: 'h-6 px-2.5 text-xs', m: 'h-8 px-3 text-[13px]' }
const base = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-[transform,background-color,color] duration-150 ease-out'

/** Tag chip. Tags are interactive (tap filters the feed), which is what justifies a chip under the anti-slop rules. */
export function TagChip({ name, size = 's', onClick, active }: { name: string; size?: Size; onClick?: () => void; active?: boolean }) {
  const c = HUE_CLASS[getTagHue(name)]
  const cls = cn(base, SIZE[size], c.soft, c.ink, active && 'ring-1 ring-current')
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn(cls, 'active:scale-95')}>#{name}</button>
  ) : (
    <span className={cls}>#{name}</span>
  )
}

/** Selectable chip (tag picker, crew size). Neutral until selected, then fills with its hue. */
export function ToggleChip({ label, hue, selected, onToggle, size = 'm' }: { label: string; hue?: Hue; selected: boolean; onToggle: () => void; size?: Size }) {
  const c = HUE_CLASS[hue ?? getTagHue(label)]
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(base, SIZE[size], 'active:scale-95',
        selected ? cn(c.soft, c.ink, 'animate-bump') : 'border border-border-strong bg-card text-muted-foreground hover:text-foreground')}
    >
      <span className={cn('size-2 rounded-full', c.solid)} />
      {label}
    </button>
  )
}
