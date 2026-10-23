import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'dark' | 'secondary' | 'danger'
type Size = 'md' | 'sm'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-mint text-ink',
  dark: 'bg-ink text-peach',
  secondary: 'bg-card text-ink',
  danger: 'bg-danger text-danger-ink',
}

// Press = shadow shrinks and the button drops by the same amount.
const SIZE: Record<Size, string> = {
  md: 'px-6 py-[15px] text-[15px] shadow-sh3 enabled:active:translate-y-[2px] enabled:active:shadow-sh3-pressed',
  sm: 'px-4 py-[9px] text-[13px] shadow-sh1 enabled:active:translate-y-px enabled:active:shadow-sh1-pressed',
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
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-ink font-bold leading-none',
        'transition-[transform,box-shadow,width,background-color] duration-150 ease-out',
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
