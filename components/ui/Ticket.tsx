import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { COLOR_CLASS, type BrandColor } from '@/lib/colors'

/**
 * Invite ticket in the crew color: a main section, a perforated divider with
 * half-circle notches cut into both edges, and a stub below.
 */
export function Ticket({
  color, top, bottom, className,
}: { color: BrandColor; top: ReactNode; bottom: ReactNode; className?: string }) {
  return (
    <div className={cn('relative rounded-lg border border-ink shadow-sh3 transition-colors duration-[400ms]', COLOR_CLASS[color].bg, className)}>
      {top}
      <div aria-hidden="true" className="relative mx-[22px] h-0 border-t-2 border-dashed border-ink">
        {/* Notches: peach circles clipped to the half that sits inside the ticket. */}
        <span className="absolute -left-[34px] -top-3 size-[22px] rounded-full border border-ink bg-peach [clip-path:inset(0_0_0_50%)]" />
        <span className="absolute -right-[34px] -top-3 size-[22px] rounded-full border border-ink bg-peach [clip-path:inset(0_50%_0_0)]" />
      </div>
      {bottom}
    </div>
  )
}

/** The invite code as letter tiles. Bump `wave` to make the letters hop in sequence. */
export function CodeTiles({ code, wave }: { code: string; wave: number }) {
  return (
    <span key={wave} className="flex gap-[6px]" aria-hidden="true">
      {code.split('').map((ch, i) => (
        <span
          key={i}
          className={cn(
            'grid h-[54px] w-[42px] place-items-center rounded-[10px] border border-ink bg-card font-display text-[26px] shadow-sh1',
            'max-[380px]:h-12 max-[380px]:w-9 max-[380px]:text-[22px]',
            wave > 0 && 'animate-wave',
          )}
          style={wave > 0 ? { animationDelay: `${i * 0.05}s` } : undefined}
        >
          {ch}
        </span>
      ))}
    </span>
  )
}
