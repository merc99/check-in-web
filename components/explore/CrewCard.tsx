import { Avatar } from '@/components/checkin/Avatar'
import { Flame } from 'lucide-react'
import { CrewCover } from '@/components/checkin/CrewCover'
import { CrewSurface } from '@/components/checkin/CrewSurface'
import { HUE_CLASS } from '@/lib/colors'
import { cn } from '@/lib/utils'
import type { ExploreGroup, MembershipStatus } from '@/lib/data'

const STATUS: Record<Exclude<MembershipStatus, null>, { label: string; className: string }> = {
  member: { label: 'Member', className: 'bg-primary-soft text-primary-ink' },
  pending: { label: 'Pending', className: 'bg-muted' },
  full: { label: 'Full', className: 'bg-card text-muted-foreground' },
}

export function StatusTag({ status, className }: { status: MembershipStatus; className?: string }) {
  if (!status) return null
  const s = STATUS[status]
  return (
    <span className={cn('flex-none whitespace-nowrap rounded-full border border-border px-[10px] py-1 text-xs font-bold', s.className, className)}>
      {s.label}
    </span>
  )
}

/**
 * A public crew in the Explore list. Each wears its own cover (color + pattern) and emoji, so the
 * list reads as different crews, not one card six times. Lifts on hover, presses down on tap.
 */
export function CrewCard({ crew, onOpen }: { crew: ExploreGroup; onOpen: () => void }) {
  const fill = Math.min(1, crew.memberCount / Math.max(1, crew.maxMembers))
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group block w-full overflow-hidden rounded-xl border border-border bg-card text-left shadow-card',
        'transition-[transform,box-shadow,border-color] duration-150 ease-out active:translate-y-px! active:shadow-none!',
        '[@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:border-border-strong [@media(hover:hover)]:hover:shadow-raised',
      )}
    >
      <CrewSurface hue={crew.color} className="flex h-[80px] items-start justify-between gap-2 p-3 shadow-none!">
        <CrewCover pattern={crew.pattern} className="text-on-color opacity-[.11]" />
        {crew.streak > 1 ? (
          <span className="relative mt-[3px] inline-flex items-center gap-1 text-[12.5px] font-bold">
            <Flame size={14} strokeWidth={2.25} aria-hidden="true" />
            <span>
              <span className="tnum">{crew.streak}</span>-day streak
            </span>
          </span>
        ) : (
          <span />
        )}
        <StatusTag status={crew.status} className="relative border-transparent bg-black/15 text-on-color" />
      </CrewSurface>
      <div className="px-4 pb-4">
        <span
          aria-hidden="true"
          className="-mt-8 grid size-[58px] rotate-[-5deg] place-items-center rounded-[18px] border border-border bg-card text-[28px] leading-none shadow-raised transition-transform duration-200 ease-out group-hover:rotate-3 group-hover:scale-105"
        >
          {crew.emoji ?? <span className="font-display">{(crew.name.trim()[0] ?? '?').toUpperCase()}</span>}
        </span>
        <h3 className="mt-3 font-display text-[20px] leading-[1.05] tracking-tighter">{crew.name}</h3>
        {crew.description && <p className="mt-1 text-sm text-muted-foreground">{crew.description}</p>}
        <div className="mt-4 flex items-center gap-3 whitespace-nowrap text-[12.5px]">
          <span className="flex">
            {crew.preview.map((p, i) => (
              <Avatar key={p.id} name={p.name} color={p.color} photoUrl={p.photoUrl} size="xs" className={i ? '-ml-2' : undefined} />
            ))}
          </span>
          {/* How full the crew is, in its own color. */}
          <span aria-hidden="true" className="h-[6px] min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <span className={cn('block h-full rounded-full', HUE_CLASS[crew.color].solid)} style={{ width: `${fill * 100}%` }} />
          </span>
          <span className="text-muted-foreground">
            <span className="tnum font-bold text-foreground">{crew.memberCount}</span> of <span className="tnum">{crew.maxMembers}</span>
            <span className="sr-only"> members</span>
          </span>
        </div>
      </div>
    </button>
  )
}
