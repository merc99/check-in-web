import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Card({ size = 'md', className, ...props }: HTMLAttributes<HTMLDivElement> & { size?: 'md' | 'lg' }) {
  return (
    <div
      className={cn(
        'border border-border bg-card shadow-card',
        size === 'lg' ? 'rounded-lg p-5' : 'rounded-lg p-4',
        className,
      )}
      {...props}
    />
  )
}
