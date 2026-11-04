'use client'

import { Check, ChevronDown, X } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '@/components/checkin/Avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { JoinRequestItem } from '@/lib/data'
import { cn } from '@/lib/utils'

/**
 * People asking to join, as a small pill in the crew header (only the crew's owner gets requests):
 * their faces and a count. It opens a list where each request is accepted or declined in place.
 * The pill goes away with the last request.
 */
export function JoinRequests({
  requests, onAccept, onDecline, onPersonTap,
}: {
  requests: JoinRequestItem[]
  onAccept: (r: JoinRequestItem) => void
  onDecline: (r: JoinRequestItem) => void
  onPersonTap: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  if (!requests.length) return null
  const n = requests.length
  const faces = requests.slice(0, 3)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`${n} ${n === 1 ? 'person wants' : 'people want'} to join`}
        className={cn(
          'hit-44 inline-flex h-[42px] flex-none items-center gap-[6px] rounded-full border bg-card pl-[5px] pr-3 edge-lit sm:pr-2',
          'transition-[transform,background-color,border-color] duration-150 ease-out hover:border-border-strong hover:bg-muted active:scale-[.97]',
          open && 'border-border-strong bg-muted',
        )}
      >
        <span className="flex">
          {faces.map((r, i) => (
            <Avatar
              key={r.id}
              name={r.person.name}
              color={r.person.color}
              photoUrl={r.person.photoUrl}
              size="sm"
              // Phones show one face, so the crew name keeps its room.
              className={cn('ring-2 ring-card', i > 0 && '-ml-3 hidden sm:grid')}
            />
          ))}
        </span>
        <span className="tnum text-[13px] font-medium">{n}</span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn('hidden text-muted-foreground transition-transform duration-150 ease-out sm:block', open && 'rotate-180')}
        />
      </PopoverTrigger>

      <PopoverContent aria-label="Join requests">
        <p className="px-2 pb-1 pt-1 text-[13px] text-muted-foreground">
          {n === 1 ? 'Wants to join your crew' : `${n} want to join your crew`}
        </p>
        <ul className="flex flex-col">
          {requests.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onPersonTap(r.person.id)
                }}
                aria-label={`View ${r.person.name}`}
                className="hit-44 flex-none rounded-full transition-transform duration-150 ease-out active:scale-[.97]"
              >
                <Avatar name={r.person.name} color={r.person.color} photoUrl={r.person.photoUrl} />
              </button>
              <p className="min-w-0 flex-1 leading-snug">
                <span className="block truncate text-[15px] font-medium">{r.person.name}</span>
                <span className="block font-mono text-[12px] text-muted-foreground">
                  <span className="tnum">{r.totalCheckIns}</span> check-ins so far
                </span>
              </p>
              <span className="flex flex-none gap-2">
                <RoundAction label={`Decline ${r.person.name}`} onClick={() => onDecline(r)}>
                  <X size={16} />
                </RoundAction>
                <RoundAction label={`Accept ${r.person.name}`} onClick={() => onAccept(r)} accept>
                  <Check size={16} strokeWidth={2.25} />
                </RoundAction>
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

function RoundAction({ label, onClick, accept, children }: { label: string; onClick: () => void; accept?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'hit-44 grid size-9 place-items-center rounded-full border transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[.97]',
        accept
          ? 'border-transparent bg-foreground text-background hover:opacity-90'
          : 'border-border-strong bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
