import Link from 'next/link'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Size = 'md' | 'sm'

const base =
  'grid flex-none place-items-center rounded-full border border-border bg-card shadow-xs transition-[transform,box-shadow] duration-120 ease-out active:translate-y-px active:shadow-none'
const SIZE: Record<Size, string> = { md: 'size-[42px]', sm: 'size-[34px]' }

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only buttons need a name. */
  'aria-label': string
  size?: Size
}

/** Round white icon button (gear, close, remove). */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { size = 'md', className, type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn(base, SIZE[size], className)} {...props} />
})

/** Same look, but navigates. */
export function IconLink({
  href, label, size = 'md', children,
}: { href: string; label: string; size?: Size; children: ReactNode }) {
  return (
    <Link href={href} aria-label={label} className={cn(base, SIZE[size])}>
      {children}
    </Link>
  )
}
