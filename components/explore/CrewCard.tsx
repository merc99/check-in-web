import { Avatar } from '@/components/checkin/Avatar'
import { CrewBlock } from '@/components/checkin/CrewBlock'
import { cn } from '@/lib/cn'
import type { ExploreGroup, MembershipStatus } from '@/lib/data'

const STATUS: Record<Exclude<MembershipStatus, null>, { label: string; className: string }> = {
  member: { label: 'Member', className: 'bg-mint' },
  pending: { label: 'Pending', className: 'bg-peach-deep' },
  full: { label: 'Full', className: 'bg-card text-ink-mute' },
}

export function StatusTag({ status }: { status: MembershipStatus }) {
  if (!status) return null
  const s = STATUS[status]
  return (
    <span className={cn('flex-none whitespace-nowrap rounded-full border border-ink px-[10px] py-1 text-xs font-bold', s.className)}>
      {s.label}
    </span>
  )
}

/** A public crew in the Explore list. Lifts on hover, presses down on tap. */
export function CrewCard({ crew, onOpen }: { crew: ExploreGroup; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group block w-full rounded-lg border border-ink bg-card p-4 text-left shadow-sh2',
        'transition-[transform,box-shadow] duration-180 ease-spring active:translate-y-px! active:shadow-sh1-pressed!',
        '[@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-sh3',
      )}
    >
      <div className="flex items-start gap-[14px]">
        <CrewBlock name={crew.name} color={crew.color} size="lg" className="group-hover:rotate-3 group-hover:scale-105" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[19px] leading-[1.05]">{crew.name}</h3>
          {crew.description && <p className="mt-1 text-sm text-ink-soft">{crew.description}</p>}
        </div>
        <StatusTag status={crew.status} />
      </div>
      <div className="mt-[14px] flex items-center gap-[10px] whitespace-nowrap border-t border-rule pt-3 text-[12.5px]">
        <span className="flex">
          {crew.preview.map((p, i) => (
            <Avatar key={p.id} name={p.name} color={p.color} photoUrl={p.photoUrl} size="xs" className={i ? '-ml-2' : undefined} />
          ))}
        </span>
        <span className="text-ink-mute">
          <span className="tnum">{crew.memberCount}</span> of <span className="tnum">{crew.maxMembers}</span> members
        </span>
        <span className="flex-1" />
        <span className="font-bold">
          <span className="tnum">{crew.streak}</span>-day streak
        </span>
      </div>
    </button>
  )
}
