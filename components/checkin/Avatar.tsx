'use client'

import { cn } from '@/lib/utils'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import { PREF, usePref } from '@/lib/prefs'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
const SIZE: Record<Size, string> = {
  xs: 'size-[22px] text-[12px]',
  sm: 'size-8 text-[13px]',
  md: 'size-10 text-[17px]',
  lg: 'size-14 text-[23px]',
  xl: 'size-[104px] text-[46px]',
}

export interface AvatarProps {
  name?: string
  color?: Hue
  photoUrl?: string | null
  size?: Size
  /** The signed-in user: gets the mint ring. */
  you?: boolean
  /** Not here yet (crew hero): white, dashed and faded instead of filled. */
  pending?: boolean
  className?: string
}

export function Avatar(props: AvatarProps) {
  const [foil] = usePref(PREF.foilFrame)
  // Perk (mastery, Committed): your avatar wears a thin holo foil ring instead of the mint one.
  if (props.you && foil && !props.pending) {
    return (
      <span className={cn('foil-frame -m-[3px] inline-grid flex-none rounded-full p-[3px]', props.className)}>
        <AvatarFace {...props} className="shadow-[0_0_0_2px_var(--background)]" you={false} />
      </span>
    )
  }
  return <AvatarFace {...props} />
}

function AvatarFace({ name, color = 'leaf', photoUrl, size = 'md', you, pending, className }: AvatarProps) {
  return (
    <span
      className={cn(
        'relative grid flex-none place-items-center overflow-hidden rounded-full border border-border font-display leading-none transition-opacity duration-200',
        pending ? 'border-dashed bg-card text-muted-foreground opacity-55' : cn(HUE_CLASS[color].solid, 'text-on-color'),
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
          <circle cx="12" cy="9" r="4" className="fill-muted-foreground" />
          <path d="M4 21c1.4-4 4.4-6 8-6s6.6 2 8 6" className="fill-muted-foreground" />
        </svg>
      )}
    </span>
  )
}
