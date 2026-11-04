'use client'

import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/checkin/Button'
import { CrewBlock } from '@/components/checkin/CrewBlock'
import { crewTint } from '@/components/checkin/CrewTint'
import { CheckIcon, PlusIcon } from '@/components/checkin/icons'
import { afterSheetClose, ResponsiveSheet } from '@/components/checkin/ResponsiveSheet'
import { HUE_CLASS } from '@/lib/colors'
import { cn } from '@/lib/utils'
import type { GroupSummary } from '@/lib/data'

/**
 * Your crews, each as a small copy of its feed header card (its hue, cover pattern and emoji tile),
 * so you pick the crew you recognise. The one you're in has an outline in its hue and says
 * "You're here"; the others say "Open" with an arrow.
 */
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
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title="Your crews"
      detents={[0.6, 0.92]}
    >
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-3">
          {groups.map((g) => {
            const active = g.id === activeId
            const t = crewTint(g.color)
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => (active ? onClose() : onPick(g.id))}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    t.className,
                    'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-[transform,border-color] duration-150 ease-out active:scale-[.98]',
                    active
                      ? 'outline-2 outline-offset-2 outline-(--hue)'
                      : '[@media(hover:hover)]:hover:border-(--hue)',
                  )}
                  style={t.style}
                >
                  <CrewBlock name={g.name} color={g.color} emoji={g.emoji} className={cn('relative', HUE_CLASS[g.color].solid, 'text-on-color')} />
                  <span className="relative min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-medium">{g.name}</span>
                    <span className="mt-0.5 block font-mono text-[12px] text-muted-foreground">
                      <span className="tnum text-foreground">{g.inToday}</span> of <span className="tnum">{g.memberCount}</span> in today
                    </span>
                  </span>
                  {active ? (
                    <span className="relative inline-flex flex-none items-center gap-1.5 rounded-full bg-foreground py-1 pl-2 pr-3 text-[12px] font-medium text-background">
                      <CheckIcon size={13} /> You’re here
                    </span>
                  ) : (
                    <span className="relative inline-flex flex-none items-center gap-0.5 text-[13px] font-medium text-muted-foreground">
                      Open <ChevronRight size={16} aria-hidden="true" />
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
        <Button
          block
          onClick={() => {
            onClose()
            afterSheetClose(() => router.push('/new-group'))
          }}
        >
          <PlusIcon size={18} /> Start or join a crew
        </Button>
      </div>
    </ResponsiveSheet>
  )
}
