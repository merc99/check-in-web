import { cn } from '@/lib/utils'
import { CheckIcon } from './icons'

/** Mint check mark + "Check-in" wordmark. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-[10px] font-display text-xl', className)}>
      <span
        aria-hidden="true"
        className="grid size-[34px] flex-none place-items-center rounded-full border border-border bg-primary text-primary-foreground shadow-xs"
      >
        <CheckIcon size={18} />
      </span>
      Check-in
    </div>
  )
}
