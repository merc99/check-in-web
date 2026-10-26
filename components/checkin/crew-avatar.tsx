import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { HUE_CLASS, type Hue } from '@/lib/colors'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
const SIZE: Record<Size, string> = {
  xs: 'size-[22px] text-[12px]', sm: 'size-8 text-[13px]', md: 'size-10 text-[16px]',
  lg: 'size-14 text-[22px]', xl: 'size-24 text-[40px]',
}

/** Wraps the shadcn Avatar (run `npx shadcn@latest add avatar` first) with Check-in hues and the "you" ring. */
export function CrewAvatar({ name, hue = 'leaf', photoUrl, size = 'md', you, className }: {
  name?: string; hue?: Hue; photoUrl?: string | null; size?: Size; you?: boolean; className?: string
}) {
  return (
    <Avatar className={cn(SIZE[size], 'ring-1 ring-inset ring-black/5', you && 'shadow-you', className)}>
      {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
      <AvatarFallback className={cn('font-display font-bold text-on-color', HUE_CLASS[hue].solid)}>
        {name?.trim()[0]?.toUpperCase() ?? ''}
      </AvatarFallback>
    </Avatar>
  )
}
