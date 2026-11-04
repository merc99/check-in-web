import { Activity, BookOpen, Brush, ListChecks, Music, Route, Timer } from 'lucide-react'
import type { ReactNode } from 'react'
import type { CheckInDetails, CheckInSource, SkillKind } from '@/lib/mastery'
import { cn } from '@/lib/utils'

/** "55 min", "1 h 30 min". */
export const formatMinutes = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`)

/**
 * A session's specifics on a post, as quiet rows of icon + plain text under the note (static
 * metadata: no pills). Loose check-ins have none and show nothing.
 */
export function SessionDetails({
  details, skill, source, className,
}: { details: CheckInDetails | null; skill: SkillKind; source?: CheckInSource; className?: string }) {
  if (!details && source !== 'strava') return null
  const rows: { key: string; icon: ReactNode; text: string; label: string }[] = []
  const d = details ?? {}
  const icon = (I: typeof Timer) => <I size={14} strokeWidth={1.75} aria-hidden="true" className="flex-none" />
  if (d.activity) rows.push({ key: 'activity', icon: icon(Activity), text: d.activity, label: 'Activity' })
  if (d.minutes) rows.push({ key: 'minutes', icon: icon(Timer), text: formatMinutes(d.minutes), label: 'Time' })
  if (d.distanceKm) rows.push({ key: 'distance', icon: icon(Route), text: `${d.distanceKm} km`, label: 'Distance' })
  if (d.book) rows.push({ key: 'book', icon: icon(BookOpen), text: d.book, label: 'Book' })
  if (d.pages) rows.push({ key: 'pages', icon: icon(BookOpen), text: `${d.pages} pages`, label: 'Pages' })
  if (d.items?.length) {
    const I = skill === 'music' ? Music : skill === 'art' ? Brush : ListChecks
    rows.push({ key: 'items', icon: icon(I), text: d.items.join(', '), label: skill === 'music' ? 'Worked on' : 'Pieces' })
  }
  if (!rows.length && source !== 'strava') return null
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground', className)}>
      {rows.map((r) => (
        <li key={r.key} className="inline-flex min-w-0 items-center gap-[6px]">
          {r.icon}
          <span className="sr-only">{r.label}: </span>
          <span className="truncate">{r.text}</span>
        </li>
      ))}
      {source === 'strava' && <li className="text-[12px] font-medium">From Strava</li>}
    </ul>
  )
}
