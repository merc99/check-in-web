import type { ReactNode } from 'react'
import { SheenLoop } from '@/components/fx/loops'
import { cn } from '@/lib/utils'
import { HUE_CLASS, type Hue } from '@/lib/colors'

/**
 * Invite ticket in the crew color: a main section, a perforated divider with
 * half-circle notches cut into both edges, and a stub below. A holographic sheen glides across it
 * (fx/SheenLoop); invite tickets are the one place that loop is allowed.
 */
export function Ticket({
  color, top, bottom, className,
}: { color: Hue; top: ReactNode; bottom: ReactNode; className?: string }) {
  return (
    <div className={cn('relative isolate rounded-lg border border-border shadow-raised transition-colors duration-200', HUE_CLASS[color].soft, className)}>
      <SheenLoop />
      {top}
      <div aria-hidden="true" className="relative mx-[22px] h-0 border-t-2 border-dashed border-border">
        {/* Notches: peach circles clipped to the half that sits inside the ticket. */}
        <span className="absolute left-[-34px] -top-3 size-[22px] rounded-full border border-border bg-background [clip-path:inset(0_0_0_50%)]" />
        <span className="absolute right-[-34px] -top-3 size-[22px] rounded-full border border-border bg-background [clip-path:inset(0_50%_0_0)]" />
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
            'grid h-[54px] w-[42px] place-items-center rounded-[10px] border border-border bg-card font-display text-[26px] shadow-xs',
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
