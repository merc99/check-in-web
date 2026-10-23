import { Foil, FoilLight } from '@/components/checkin/Foil'
import { cn } from '@/lib/utils'
import { HUE_CLASS } from '@/lib/colors'
import type { Achievement } from '@/lib/data'

/**
 * Medal card for the achievements shelf. Unlocked ones are foil: filled with the achievement's
 * color, a dark enamel medal, and a white sheen that tilts toward the pointer (a tap sweeps it on
 * touch). Locked ones are dashed and hide their glyph. `finish="sweep"` is the older plain card
 * with a light sweep on hover, kept for the effects preview.
 */
export function AchievementCard({
  achievement: a, tilt, finish = 'foil',
}: { achievement: Achievement; tilt: 'left' | 'right'; finish?: 'sweep' | 'foil' }) {
  const foil = finish === 'foil' && a.unlocked
  const card = (
    <div
      className={cn(
        'relative w-[118px] flex-none snap-start overflow-hidden rounded-lg border px-[10px] py-4 text-center',
        tilt === 'left' ? 'rotate-[-1.5deg]' : 'rotate-[1.2deg]',
        foil
          ? cn(HUE_CLASS[a.color].solid, 'border-on-color/15 text-on-color shadow-raised')
          : a.unlocked
          ? [
              'border-border bg-card shadow-card',
              'after:pointer-events-none after:absolute after:inset-0 after:translate-x-[-120%] after:bg-linear-to-r',
              'after:from-transparent after:from-35% after:via-card/75 after:via-50% after:to-transparent after:to-65%',
              'hover:after:translate-x-[120%] hover:after:transition-transform hover:after:duration-700 hover:after:ease-out',
            ].join(' ')
          : 'border-dashed border-border bg-muted',
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'mx-auto mb-[10px] grid size-[58px] place-items-center rounded-full border font-display text-[19px]',
          foil
            ? 'border-on-color bg-on-color text-[21px] shadow-xs'
            : a.unlocked
            ? cn(HUE_CLASS[a.color].solid, 'border-border text-on-color shadow-xs')
            : 'border-dashed border-border bg-background text-muted-foreground',
        )}
        // The enamel disc shows the number in the card's own color.
        style={foil ? { color: HUE_CLASS[a.color].cssVar } : undefined}
      >
        {a.unlocked ? a.glyph : '?'}
      </div>
      <div className="text-[13px] font-bold leading-[1.2]">{a.title}</div>
      <div className={cn('mt-1 text-[11.5px]', foil ? 'font-medium' : 'text-muted-foreground')}>{a.subtitle}</div>
      <span className="sr-only">{a.unlocked ? 'Unlocked' : 'Locked'}</span>
      {foil && <FoilLight />}
    </div>
  )

  return foil ? (
    <Foil hue="white" strength={0.6} className="flex-none snap-start">
      {card}
    </Foil>
  ) : (
    card
  )
}
