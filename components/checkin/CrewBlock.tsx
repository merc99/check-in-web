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

/** The tilted square with a crew's emoji (or its first letter). `white` for use on top of the crew color. */
export function CrewBlock({
  name, color, emoji, size = 'md', white, className,
}: { name: string; color: Hue; emoji?: string | null; size?: Size; white?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid flex-none rotate-[-4deg] place-items-center border border-border font-display leading-none shadow-xs transition-transform duration-200 ease-out',
        white ? 'bg-card' : HUE_CLASS[color].solid,
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
    <span aria-hidden="true" className={cn('size-[14px] flex-none rounded-full border border-border', HUE_CLASS[color].solid, className)} />
  )
}
