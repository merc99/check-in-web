import { Avatar } from '@/components/checkin/Avatar'
import { Gloss, GlossPill } from '@/components/fx/Gloss'
import type { MyInsights } from '@/lib/data'
import { cn } from '@/lib/utils'

const TOP = 7

/**
 * Everyone in your crews by current streak (pattern: mmo nodes season leaderboard). Encouraging,
 * not competitive: you're always shown, even outside the top seven, and nobody is ranked last.
 */
export function CrewLeaderboard({ rows }: { rows: MyInsights['leaderboard'] }) {
  const max = Math.max(1, ...rows.map((r) => r.streak))
  const top = rows.slice(0, TOP)
  const meIndex = rows.findIndex((r) => r.isMe)
  const shown = meIndex >= TOP ? [...top, rows[meIndex]] : top
  return (
    <Gloss hue="lemon" className="rounded-xl p-4">
      <div className="flex items-center justify-between gap-2">
        <GlossPill>By current streak</GlossPill>
        <GlossPill solid>Everyone in your crews</GlossPill>
      </div>
      <ol className="mt-3 flex flex-col gap-[6px]">
        {shown.map((r) => {
          const rank = rows.indexOf(r) + 1
          return (
            <li
              key={r.person.id}
              className={cn(
                'flex items-center gap-3 rounded-[12px] px-2 py-[7px]',
                r.isMe ? 'bg-white/80 shadow-[inset_0_0_0_1px_rgb(255_255_255/.9)]' : 'bg-white/25 shadow-[inset_0_0_0_1px_rgb(255_255_255/.35)]',
              )}
            >
              <span
                className={cn(
                  'tnum grid size-6 flex-none place-items-center rounded-full text-[12px] font-bold',
                  rank <= 3 ? 'bg-on-color text-lemon' : 'bg-white/40',
                )}
              >
                {rank}
              </span>
              <Avatar name={r.person.name} color={r.person.color} photoUrl={r.person.photoUrl} size="sm" you={r.isMe} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold">{r.isMe ? 'You' : r.person.name}</span>
                <span className="tnum block text-[11.5px] font-medium opacity-75">{r.total} all time</span>
              </span>
              <span className="hidden h-[6px] w-20 overflow-hidden rounded-full bg-white/40 sm:block" aria-hidden="true">
                <span className="block h-full rounded-full bg-on-color" style={{ width: `${(r.streak / max) * 100}%` }} />
              </span>
              <span className="tnum w-8 text-right font-display text-[18px] leading-none" aria-label={`${r.streak}-day streak`}>
                {r.streak}
              </span>
            </li>
          )
        })}
      </ol>
    </Gloss>
  )
}
