import type { ReactNode } from 'react'
import { Avatar } from '@/components/checkin/Avatar'
import type { MyInsights } from '@/lib/data'
import { cn } from '@/lib/utils'

const TOP = 7

/**
 * Everyone in your crews by current streak, as a hairline list (references: Data API "Your connections",
 * Chord "Route by chord"). Encouraging, not competitive: you're always shown, even outside the top
 * seven, and nobody is ranked last. One accent: your own bar is mint, everyone else's is neutral.
 */
export function CrewLeaderboard({ rows, onPersonTap }: { rows: MyInsights['leaderboard']; onPersonTap?: (id: string) => void }) {
  const max = Math.max(1, ...rows.map((r) => r.streak))
  const top = rows.slice(0, TOP)
  const meIndex = rows.findIndex((r) => r.isMe)
  const shown = meIndex >= TOP ? [...top, rows[meIndex]] : top
  return (
    <div className="rounded-xl border bg-card p-2 edge-lit">
      <div className="flex items-baseline justify-between gap-3 px-3 pb-2 pt-2 text-[13px] text-muted-foreground">
        <span>Everyone in your crews</span>
        <span className="font-mono text-[12px]">streak</span>
      </div>
      <ol className="flex flex-col">
        {shown.map((r) => {
          const rank = rows.indexOf(r) + 1
          return (
            <li key={r.person.id} className="border-t first:border-t-0">
              {/* A crewmate's row opens their profile; yours is just yours. */}
              <Row
                onClick={!r.isMe && onPersonTap ? () => onPersonTap(r.person.id) : undefined}
                label={r.isMe ? undefined : `View ${r.person.name}, ${r.streak}-day streak`}
                className={cn('flex w-full items-center gap-3 rounded-md px-3 py-2 text-left', r.isMe && 'my-1 bg-muted edge-lit')}
              >
                <span className="tnum w-4 flex-none font-mono text-[12px] text-subtle-foreground">{rank}</span>
                <Avatar name={r.person.name} color={r.person.color} photoUrl={r.person.photoUrl} size="sm" you={r.isMe} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{r.isMe ? 'You' : r.person.name}</span>
                  <span className="tnum block font-mono text-[12px] text-muted-foreground">{r.total} all time</span>
                </span>
                <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted sm:block" aria-hidden="true">
                  <span
                    className={cn('block h-full origin-left rounded-full', r.isMe ? 'bg-primary' : 'bg-muted-foreground/50')}
                    style={{ transform: `scaleX(${r.streak / max})` }}
                  />
                </span>
                <span className="tnum w-8 text-right text-[16px] font-medium leading-none" aria-label={`${r.streak}-day streak`}>
                  {r.streak}
                </span>
              </Row>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** A leaderboard row: a button when it can be tapped, else a plain row. */
function Row({ onClick, label, className, children }: { onClick?: () => void; label?: string; className: string; children: ReactNode }) {
  if (!onClick) return <div className={className}>{children}</div>
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(className, 'transition-[transform,background-color] duration-150 ease-out hover:bg-muted active:scale-[.99]')}
    >
      {children}
    </button>
  )
}
