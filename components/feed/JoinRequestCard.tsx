import { Avatar } from '@/components/checkin/Avatar'
import { Button } from '@/components/checkin/Button'
import { Card } from '@/components/checkin/Card'
import type { JoinRequestItem } from '@/lib/data'

/** Shown at the top of the feed, to the person who started the crew. */
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
    <Card className="mb-4 bg-card">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onPersonTap(person.id)}
          aria-label={`View ${person.name}`}
          className="rounded-full transition-transform duration-150 ease-out hover:scale-[1.06]"
        >
          <Avatar name={person.name} color={person.color} photoUrl={person.photoUrl} />
        </button>
        <p className="min-w-0 flex-1">
          <b>{person.name}</b> wants to join your crew.
          <br />
          <span className="text-[13px] text-muted-foreground">
            <span className="tnum">{request.totalCheckIns}</span> check-ins so far
          </span>
        </p>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" onClick={onDecline}>
          Decline
        </Button>
        <Button size="sm" variant="primary" onClick={onAccept}>
          Accept
        </Button>
      </div>
    </Card>
  )
}
