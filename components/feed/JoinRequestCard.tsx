import { Plus } from 'lucide-react'
import { Avatar } from '@/components/checkin/Avatar'
import { Button } from '@/components/checkin/Button'
import type { JoinRequestItem } from '@/lib/data'

/** Shown at the top of the feed, to the person who started the crew. Rivals-style request row. */
export function JoinRequestCard({
  request, onAccept, onDecline, onPersonTap,
}: {
  request: JoinRequestItem
  onAccept: () => void
  onDecline: () => void
  onPersonTap: (id: string) => void
}) {
  const { person } = request
  return (
    <div className="mb-3 rounded-xl border bg-card p-3 edge-lit">
      <div className="flex items-center gap-3 p-1">
        <button
          type="button"
          onClick={() => onPersonTap(person.id)}
          aria-label={`View ${person.name}`}
          className="relative flex-none rounded-full transition-transform duration-150 ease-out active:scale-[.96]"
        >
          <Avatar name={person.name} color={person.color} photoUrl={person.photoUrl} />
          <span aria-hidden="true" className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground">
            <Plus size={12} strokeWidth={2.5} />
          </span>
        </button>
        <p className="min-w-0 flex-1 leading-snug">
          <span className="font-medium">{person.name}</span> wants to join your crew
          <span className="block text-[13px] text-muted-foreground">
            <span className="tnum">{request.totalCheckIns}</span> check-ins so far
          </span>
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button size="sm" variant="primary" onClick={onAccept}>
          Accept
        </Button>
        <Button size="sm" onClick={onDecline}>
          Decline
        </Button>
      </div>
    </div>
  )
}
