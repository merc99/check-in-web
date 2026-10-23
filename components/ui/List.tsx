import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/** White card that holds rows, divided by rule lines. Children are the rows. */
export function List({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'divide-y-[1.5px] divide-rule overflow-hidden rounded-card border border-ink bg-card shadow-sh2',
        className,
      )}
      {...props}
    />
  )
}

/** Standard row padding and layout for a List. */
export const listRow = 'flex w-full items-center gap-3 px-4 py-3 text-left'
