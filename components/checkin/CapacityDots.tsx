import { cn } from '@/lib/cn'

/** One small dot per seat: filled ink for each member, faint outline for open seats. For use on crew-colored cards. */
export function CapacityDots({ filled, max }: { filled: number; max: number }) {
  return (
    <span aria-hidden="true" className="flex flex-wrap gap-[3px]">
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={cn('size-[9px] rounded-full border border-ink', i < filled ? 'bg-ink' : 'opacity-50')} />
      ))}
    </span>
  )
}
