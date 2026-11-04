import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'brand' | 'dark' | 'secondary' | 'danger'
type Size = 'md' | 'sm'

// primary = the one bright button per screen (off-white on dark, near-black on light).
// brand = mint, kept for the check-in action only, so mint keeps meaning "showing up".
const VARIANT: Record<Variant, string> = {
  primary: 'border-transparent bg-foreground text-background edge-lit enabled:hover:bg-foreground/90',
  brand: 'border-transparent bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/.3)] enabled:hover:bg-primary/90',
  dark: 'border-transparent bg-foreground text-background edge-lit',
  secondary: 'border-border bg-muted text-foreground edge-lit enabled:hover:border-border-strong',
  danger: 'border-transparent bg-destructive-soft text-destructive-ink',
}

const SIZE: Record<Size, string> = {
  md: 'h-12 px-6 text-[15px]',
  sm: 'h-9 px-4 text-[13px]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', block, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border font-medium leading-none',
        'transition-[transform,background-color,border-color] duration-150 ease-out enabled:active:scale-[.97]',
        'disabled:cursor-not-allowed disabled:opacity-45',
        VARIANT[variant],
        SIZE[size],
        block && 'w-full',
        className,
      )}
      {...props}
    />
  )
})
