import { cn } from '@/lib/utils'
import { HUE_CLASS } from '@/lib/colors'
import type { Achievement } from '@/lib/data'

/**
 * Medal card for the achievements shelf. Unlocked ones get a light sweep on hover;
 * locked ones are dashed and hide their glyph.
 */
export function AchievementCard({ achievement: a, tilt }: { achievement: Achievement; tilt: 'left' | 'right' }) {
  return (
    <div
      className={cn(
        'relative w-[118px] flex-none snap-start overflow-hidden rounded-lg border border-border px-[10px] py-4 text-center',
        tilt === 'left' ? 'rotate-[-1.5deg]' : 'rotate-[1.2deg]',
        a.unlocked
          ? [
              'bg-card shadow-card',
              'after:pointer-events-none after:absolute after:inset-0 after:translate-x-[-120%] after:bg-linear-to-r',
              'after:from-transparent after:from-35% after:via-card/75 after:via-50% after:to-transparent after:to-65%',
              'hover:after:translate-x-[120%] hover:after:transition-transform hover:after:duration-700 hover:after:ease-out',
            ].join(' ')
          : 'border-dashed bg-muted',
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'mx-auto mb-[10px] grid size-[58px] place-items-center rounded-full border border-border font-display text-[19px]',
          a.unlocked ? cn(HUE_CLASS[a.color].solid, 'text-on-color shadow-xs') : 'border-dashed bg-background text-muted-foreground',
        )}
      >
        {a.unlocked ? a.glyph : '?'}
      </div>
      <div className="text-[13px] font-bold leading-[1.2]">{a.title}</div>
      <div className="mt-1 text-[11.5px] text-muted-foreground">{a.subtitle}</div>
      <span className="sr-only">{a.unlocked ? 'Unlocked' : 'Locked'}</span>
    </div>
  )
}
