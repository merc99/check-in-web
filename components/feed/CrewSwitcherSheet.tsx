'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/checkin/Button'
import { CrewBlock } from '@/components/checkin/CrewBlock'
import { CheckIcon, PlusIcon } from '@/components/checkin/icons'
import { List, listRow } from '@/components/checkin/List'
import { Sheet } from '@/components/checkin/Sheet'
import { cn } from '@/lib/utils'
import type { GroupSummary } from '@/lib/data'

export function CrewSwitcherSheet({
  open, onClose, groups, activeId, onPick,
}: {
  open: boolean
  onClose: () => void
  groups: GroupSummary[]
  activeId: string | null
  onPick: (id: string) => void
}) {
  const router = useRouter()
  return (
    <Sheet open={open} onClose={onClose} title="Your crews">
      <div className="flex flex-col gap-4">
        <List>
          {groups.map((g) => {
            const active = g.id === activeId
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onPick(g.id)}
                aria-current={active ? 'true' : undefined}
                className={cn(listRow, active && 'bg-muted')}
              >
                <CrewBlock name={g.name} color={g.color} emoji={g.emoji} />
                <span className="min-w-0 flex-1">
                  <b>{g.name}</b>
                  <br />
                  <span className="tnum text-[12.5px] text-muted-foreground">
                    {g.inToday} of {g.memberCount} in today
                  </span>
                </span>
                {active && <CheckIcon size={18} />}
              </button>
            )
          })}
        </List>
        <Button block onClick={() => router.push('/new-group')}>
          <PlusIcon size={18} /> Start or join a crew
        </Button>
      </div>
    </Sheet>
  )
}
