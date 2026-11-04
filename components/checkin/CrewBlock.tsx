import { cn } from '@/lib/utils'
import { HUE_CLASS, type Hue } from '@/lib/colors'

type Size = 'sm' | 'list' | 'md' | 'lg' | 'xl'
const SIZE: Record<Size, string> = {
  sm: 'size-8 rounded-[10px] text-sm', // tag manager rows
  list: 'size-[38px] rounded-md text-base', // You tab crew list
  md: 'size-[42px] rounded-md text-[17px]', // crew switcher, You tab
  lg: 'size-[52px] rounded-lg text-[22px]', // explore cards
  xl: 'size-16 rounded-lg text-[28px]', // new crew preview
}

/** The crew's medal: a rounded square in a soft tint of its hue with its emoji (or first letter). */
export function CrewBlock({
  name, color, emoji, size = 'md', white, className,
}: { name: string; color: Hue; emoji?: string | null; size?: Size; white?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid flex-none place-items-center font-medium leading-none edge-lit transition-transform duration-200 ease-out',
        white ? 'border border-border bg-card' : cn(HUE_CLASS[color].soft, HUE_CLASS[color].ink),
        SIZE[size],
        className,
      )}
    >
      {emoji ? <span className="text-[.85em] leading-none">{emoji}</span> : (name.trim()[0] ?? '?').toUpperCase()}
    </span>
  )
}

/** Small round crew color dot. */
export function CrewDot({ color, className }: { color: Hue; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('size-3 flex-none rounded-full', HUE_CLASS[color].solid, className)} />
  )
}
