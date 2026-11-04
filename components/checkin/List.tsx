import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** A card that holds rows, divided by hairlines. Children are the rows. */
export function List({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'divide-y divide-border overflow-hidden rounded-xl border border-border bg-card edge-lit',
        className,
      )}
      {...props}
    />
  )
}

/** Standard row padding and layout for a List. */
export const listRow = 'flex w-full items-center gap-3 px-4 py-3 text-left'
