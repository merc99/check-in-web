import { cn } from '@/lib/cn'
import { COLOR_CLASS, type BrandColor } from '@/lib/colors'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
const SIZE: Record<Size, string> = {
  xs: 'size-[22px] text-[10px]',
  sm: 'size-8 text-[13px]',
  md: 'size-10 text-[17px]',
  lg: 'size-14 text-[23px]',
  xl: 'size-[104px] text-[46px]',
}

export interface AvatarProps {
  name?: string
  color?: BrandColor
  photoUrl?: string | null
  size?: Size
  /** The signed-in user: gets the mint ring. */
  you?: boolean
  className?: string
}

export function Avatar({ name, color = 'mint', photoUrl, size = 'md', you, className }: AvatarProps) {
  return (
    <span
      className={cn(
        'relative grid flex-none place-items-center overflow-hidden rounded-full border border-ink font-display leading-none text-ink',
        COLOR_CLASS[color].bg,
        SIZE[size],
        you && 'shadow-you',
        className,
      )}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : name ? (
        name.trim()[0]?.toUpperCase()
      ) : (
        <svg viewBox="0 0 24 24" className="size-[62%]" aria-hidden="true">
          <circle cx="12" cy="9" r="4" className="fill-ink-mute" />
          <path d="M4 21c1.4-4 4.4-6 8-6s6.6 2 8 6" className="fill-ink-mute" />
        </svg>
      )}
    </span>
  )
}
