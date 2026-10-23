import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Card({ size = 'md', className, ...props }: HTMLAttributes<HTMLDivElement> & { size?: 'md' | 'lg' }) {
  return (
    <div
      className={cn(
        'border border-ink bg-card shadow-sh2',
        size === 'lg' ? 'rounded-lg p-5' : 'rounded-card p-4',
        className,
      )}
      {...props}
    />
  )
}
