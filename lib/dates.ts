// Date helpers. A check-in belongs to the user's *local* calendar day (`local_date`,
// YYYY-MM-DD), not to its UTC timestamp. Streaks are counted on local dates.

export const MINUTE = 60_000
export const HOUR = 3_600_000
export const DAY = 86_400_000

export type LocalDate = string // 'YYYY-MM-DD'

const pad = (n: number) => String(n).padStart(2, '0')

export function localDate(d: Date = new Date()): LocalDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseLocalDate(s: LocalDate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function startOfDay(d: Date = new Date()): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** 'now', '5m', '3h', '2d' — the feed's compact relative time. */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = (now - new Date(iso).getTime()) / 1000
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

/** Feed day divider: Today, Yesterday, weekday this week, then a short date. */
export function dayLabel(day: LocalDate, today: Date = new Date()): string {
  if (day === localDate(today)) return 'Today'
  if (day === localDate(addDays(today, -1))) return 'Yesterday'
  const d = parseLocalDate(day)
  if (startOfDay(today).getTime() - d.getTime() < 6 * DAY) {
    return d.toLocaleDateString(undefined, { weekday: 'long' })
  }
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

/** 'Sep 2026' */
export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

/**
 * Consecutive days ending today. If today has no check-in yet, count back from
 * yesterday instead: today is still open, so the streak hasn't slipped.
 */
export function currentStreak(days: ReadonlySet<LocalDate>, today: Date = new Date()): number {
  let cursor = days.has(localDate(today)) ? today : addDays(today, -1)
  let n = 0
  while (days.has(localDate(cursor))) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

/** Longest run of consecutive days, ever. */
export function bestStreak(days: ReadonlySet<LocalDate>): number {
  const sorted = Array.from(days).sort()
  let best = 0
  let run = 0
  let prev: Date | null = null
  for (const s of sorted) {
    const d = parseLocalDate(s)
    run = prev && localDate(addDays(prev, 1)) === s ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}
