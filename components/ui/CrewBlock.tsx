import { cn } from '@/lib/cn'
import { COLOR_CLASS, type BrandColor } from '@/lib/colors'

type Size = 'sm' | 'md' | 'lg' | 'xl'
const SIZE: Record<Size, string> = {
  sm: 'size-8 rounded-[10px] text-sm', // tag manager rows
  md: 'size-[42px] rounded-input text-[17px]', // crew switcher, You tab
  lg: 'size-[52px] rounded-card text-[22px]', // explore cards
  xl: 'size-16 rounded-card text-[28px]', // new crew preview
}

/** The tilted square with a crew's first letter. `white` for use on top of the crew color. */
export function CrewBlock({
  name, color, size = 'md', white, className,
}: { name: string; color: BrandColor; size?: Size; white?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid flex-none -rotate-[4deg] place-items-center border border-ink font-display leading-none shadow-sh1 transition-transform duration-300 ease-spring',
        white ? 'bg-card' : COLOR_CLASS[color].bg,
        SIZE[size],
        className,
      )}
    >
      {(name.trim()[0] ?? '?').toUpperCase()}
    </span>
  )
}

/** Small round crew color dot. */
export function CrewDot({ color, className }: { color: BrandColor; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('size-[14px] flex-none rounded-full border border-ink', COLOR_CLASS[color].bg, className)} />
  )
}
