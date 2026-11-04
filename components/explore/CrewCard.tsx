import { Avatar } from '@/components/checkin/Avatar'
import { Flame } from 'lucide-react'
import { CrewCover } from '@/components/checkin/CrewCover'
import { HUE_CLASS } from '@/lib/colors'
import { cn } from '@/lib/utils'
import type { ExploreGroup, MembershipStatus } from '@/lib/data'

const STATUS: Record<Exclude<MembershipStatus, null>, { label: string; className: string }> = {
  member: { label: 'Member', className: 'bg-primary-soft text-primary-ink' },
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  full: { label: 'Full', className: 'bg-card text-muted-foreground' },
}

export function StatusTag({ status, className }: { status: MembershipStatus; className?: string }) {
  if (!status) return null
  const s = STATUS[status]
  return (
    <span className={cn('flex-none whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-xs font-medium', s.className, className)}>
      {s.label}
    </span>
  )
}

/**
 * A public crew in the Explore list: a neutral card whose cover photo (or soft tint, pattern and emoji)
 * makes each crew its own. The edge brightens on hover; the card presses down on tap.
 */
export function CrewCard({ crew, onOpen }: { crew: ExploreGroup; onOpen: () => void }) {
  const fill = Math.min(1, crew.memberCount / Math.max(1, crew.maxMembers))
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group block w-full overflow-hidden rounded-xl border border-border bg-card text-left edge-lit',
        'transition-[transform,border-color] duration-150 ease-out active:scale-[.99] [@media(hover:hover)]:hover:border-border-strong',
      )}
    >
      {crew.coverUrl ? (
        // A cover photo: the facts sit on a soft dark fade at the top so they read on any image.
        <div className="relative h-[136px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={crew.coverUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(rgb(0_0_0/.55),transparent)]" />
          <div className="relative flex items-start justify-between gap-2 p-3 text-white">
            <CoverFacts crew={crew} />
            <StatusTag status={crew.status} className="relative border-white/25 bg-black/35 text-white backdrop-blur-sm" />
          </div>
        </div>
      ) : (
        // No photo: a quiet cover in the crew's soft tint with its pattern, the medal carries the color.
        <div className={cn('relative flex h-[80px] items-start justify-between gap-2 overflow-hidden p-3', HUE_CLASS[crew.color].soft, HUE_CLASS[crew.color].ink)}>
          <CrewCover pattern={crew.pattern} className="opacity-[.18]" />
          <CoverFacts crew={crew} />
          <StatusTag status={crew.status} className="relative bg-card text-muted-foreground" />
        </div>
      )}
      <div className={cn('px-4 pb-4', crew.coverUrl && 'pt-4')}>
        {/* With a photo, the photo is the crew's face; without one, its emoji tile overlaps the cover. */}
        {!crew.coverUrl && (
        <span
          aria-hidden="true"
          className="-mt-8 grid size-14 place-items-center rounded-[16px] border border-border bg-card text-[26px] leading-none edge-lit"
        >
          {crew.emoji ?? <span className="font-medium">{(crew.name.trim()[0] ?? '?').toUpperCase()}</span>}
        </span>
        )}
        <h3 className={cn(!crew.coverUrl && 'mt-3', 'text-[18px] font-medium leading-tight tracking-normal')}>{crew.name}</h3>
        {crew.description && <p className="mt-1 text-[14px] text-muted-foreground">{crew.description}</p>}
        <div className="mt-4 flex items-center gap-3 whitespace-nowrap text-[13px]">
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
            <span className="tnum text-foreground">{crew.memberCount}</span> of <span className="tnum">{crew.maxMembers}</span>
            <span className="sr-only"> members</span>
          </span>
        </div>
      </div>
    </button>
  )
}

/** The crew streak on a card's cover (plain text, in the cover's own ink). */
function CoverFacts({ crew }: { crew: ExploreGroup }) {
  if (crew.streak <= 1) return <span />
  return (
    <span className="relative mt-1 inline-flex items-center gap-1 font-mono text-[12px]">
      <Flame size={14} strokeWidth={1.75} aria-hidden="true" />
      <span>
        <span className="tnum">{crew.streak}</span>-day streak
      </span>
    </span>
  )
}
