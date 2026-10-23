import Link from 'next/link'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { BackIcon } from './icons'

const base =
  'inline-flex items-center gap-[6px] px-1 py-2 font-bold underline decoration-[1.5px] underline-offset-[3px]'

/** Underlined text action ("Skip", "Remove photo"). `danger` for destructive ones. */
export const TextButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }>(
  function TextButton({ danger, className, type = 'button', ...props }, ref) {
    return <button ref={ref} type={type} className={cn(base, danger ? 'text-destructive-ink' : 'text-foreground', className)} {...props} />
  },
)

/** Same look, navigates. */
export function TextLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cn(base, 'text-foreground', className)}>
      {children}
    </Link>
  )
}

/** "‹ Back" at the top of non-tab screens. */
export function BackLink({ href, label = 'Back' }: { href: string; label?: string }) {
  return (
    <TextLink href={href} className="ml-[-6px] mt-[14px] gap-1 no-underline">
      <BackIcon size={18} />
      <span className="underline decoration-[1.5px] underline-offset-[3px]">{label}</span>
    </TextLink>
  )
}
