// Per-skill achievements (mastery, slice 2): lots of small, obtainable goals, computed from a person's
// sessions in one crew and their details. Rarity lives in the tiers; these are about momentum.
import type { CheckInDetails, SkillKind } from './mastery'

export interface SessionRow {
  at: Date
  details: CheckInDetails | null
  source: 'manual' | 'strava'
  photo: boolean
}

export interface SkillAchievement {
  key: string
  title: string
  subtitle: string
  unlocked: boolean
  /** How far along, for the ones with a count (shown as a small bar). */
  progress: { n: number; of: number } | null
}

interface Stats {
  count: number
  minutes: number
  distance: number
  pages: number
  items: Set<string>
  books: Set<string>
  strava: number
  photos: number
  detailed: number
  longest: number
  bestMonth: number
  earlyBirds: number
  weekends: number
  longestSession: number
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

export function statsOf(rows: SessionRow[]): Stats {
  const s: Stats = {
    count: rows.length, minutes: 0, distance: 0, pages: 0, items: new Set(), books: new Set(), strava: 0, photos: 0,
    detailed: 0, longest: 0, bestMonth: 0, earlyBirds: 0, weekends: 0, longestSession: 0,
  }
  const months = new Map<string, number>()
  const weekendKeys = new Set<string>()
  const days = new Set<string>()
  for (const r of rows) {
    const d = r.details
    if (d) {
      s.detailed++
      s.minutes += d.minutes ?? 0
      s.longestSession = Math.max(s.longestSession, d.minutes ?? 0)
      s.distance += d.distanceKm ?? 0
      s.pages += d.pages ?? 0
      d.items?.forEach((i) => s.items.add(i.toLowerCase()))
      if (d.book) s.books.add(d.book.toLowerCase())
    }
    if (r.source === 'strava') s.strava++
    if (r.photo) s.photos++
    if (r.at.getHours() < 7) s.earlyBirds++
    const m = `${r.at.getFullYear()}-${r.at.getMonth()}`
    months.set(m, (months.get(m) ?? 0) + 1)
    if (r.at.getDay() === 0 || r.at.getDay() === 6) {
      const sat = new Date(r.at)
      sat.setDate(sat.getDate() - ((sat.getDay() + 1) % 7))
      weekendKeys.add(dayKey(sat))
    }
    days.add(dayKey(r.at))
  }
  s.bestMonth = Math.max(0, ...months.values())
  s.weekends = weekendKeys.size
  // Longest run of consecutive days.
  const sorted = [...days].map((k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m, d).getTime() }).sort((a, b) => a - b)
  let run = 0
  for (let i = 0; i < sorted.length; i++) {
    run = i && sorted[i] - sorted[i - 1] <= 26 * 3600 * 1000 && sorted[i] - sorted[i - 1] > 0 ? run + 1 : 1
    s.longest = Math.max(s.longest, run)
  }
  return s
}

type Def = { key: string; title: string; subtitle: string; kinds: SkillKind[] | 'all'; n: (s: Stats) => number; of: number }

const ALL: Def[] = [
  { key: 'first', title: 'First session', subtitle: 'You showed up', kinds: 'all', n: (s) => s.count, of: 1 },
  { key: 'three', title: 'Three in a row', subtitle: '3 days running', kinds: 'all', n: (s) => s.longest, of: 3 },
  { key: 'ten', title: 'Ten deep', subtitle: '10 sessions', kinds: 'all', n: (s) => s.count, of: 10 },
  { key: 'detail', title: 'In the details', subtitle: 'A session with details', kinds: 'all', n: (s) => s.detailed, of: 1 },
  { key: 'week', title: 'Full week', subtitle: '7 days running', kinds: 'all', n: (s) => s.longest, of: 7 },
  { key: 'month', title: 'Big month', subtitle: '15 sessions in a month', kinds: 'all', n: (s) => s.bestMonth, of: 15 },
  { key: 'weekends', title: 'Weekend regular', subtitle: '4 weekends', kinds: 'all', n: (s) => s.weekends, of: 4 },
  { key: 'early', title: 'Early bird', subtitle: '5 sessions before 7am', kinds: 'all', n: (s) => s.earlyBirds, of: 5 },
  { key: 'quarter', title: 'Quarter century', subtitle: '25 sessions', kinds: 'all', n: (s) => s.count, of: 25 },
  { key: 'photo', title: 'Pics or it didn’t happen', subtitle: 'A session with a photo', kinds: 'all', n: (s) => s.photos, of: 1 },
  { key: 'hundred', title: 'Hundred club', subtitle: '100 sessions', kinds: 'all', n: (s) => s.count, of: 100 },
  { key: 'tenhours', title: 'Ten hours in', subtitle: '10 hours logged', kinds: 'all', n: (s) => Math.floor(s.minutes / 60), of: 10 },

  { key: 'thirty', title: 'Half an hour', subtitle: 'A 30-minute session', kinds: ['fitness'], n: (s) => (s.longestSession >= 30 ? 1 : 0), of: 1 },
  { key: 'strava5', title: 'Synced up', subtitle: '5 sessions from Strava', kinds: ['fitness'], n: (s) => s.strava, of: 5 },
  { key: 'km50', title: 'Fifty k', subtitle: '50 km all told', kinds: ['fitness'], n: (s) => Math.floor(s.distance), of: 50 },
  { key: 'km250', title: 'Long road', subtitle: '250 km all told', kinds: ['fitness'], n: (s) => Math.floor(s.distance), of: 250 },
  { key: 'hour', title: 'The long one', subtitle: 'A 90-minute session', kinds: ['fitness'], n: (s) => (s.longestSession >= 90 ? 1 : 0), of: 1 },

  { key: 'twenty', title: 'Twenty minutes', subtitle: 'A 20-minute practice', kinds: ['music'], n: (s) => (s.longestSession >= 20 ? 1 : 0), of: 1 },
  { key: 'songs5', title: 'Setlist', subtitle: '5 songs or exercises', kinds: ['music'], n: (s) => s.items.size, of: 5 },
  { key: 'songs25', title: 'Songbook', subtitle: '25 songs or exercises', kinds: ['music'], n: (s) => s.items.size, of: 25 },
  { key: 'music50h', title: 'Woodshedding', subtitle: '50 hours practised', kinds: ['music'], n: (s) => Math.floor(s.minutes / 60), of: 50 },

  { key: 'pages100', title: 'Hundred pages', subtitle: '100 pages read', kinds: ['reading'], n: (s) => s.pages, of: 100 },
  { key: 'pages1k', title: 'Thousand pages', subtitle: '1,000 pages read', kinds: ['reading'], n: (s) => s.pages, of: 1000 },
  { key: 'books3', title: 'Shelf', subtitle: '3 different books', kinds: ['reading'], n: (s) => s.books.size, of: 3 },

  { key: 'pieces10', title: 'Portfolio', subtitle: '10 pieces', kinds: ['art'], n: (s) => s.items.size, of: 10 },
  { key: 'art25h', title: 'Studio hours', subtitle: '25 hours making', kinds: ['art'], n: (s) => Math.floor(s.minutes / 60), of: 25 },

  { key: 'deep', title: 'Deep work', subtitle: 'A 45-minute session', kinds: ['writing', 'mind', 'health', 'other'], n: (s) => (s.longestSession >= 45 ? 1 : 0), of: 1 },
]

/** The achievements a skill offers, unlocked or not, obtainable ones first. */
export function skillAchievements(kind: SkillKind, rows: SessionRow[]): SkillAchievement[] {
  const s = statsOf(rows)
  return ALL.filter((d) => d.kinds === 'all' || d.kinds.includes(kind))
    .map((d) => {
      const n = Math.min(d.n(s), d.of)
      return { key: d.key, title: d.title, subtitle: d.subtitle, unlocked: n >= d.of, progress: d.of > 1 ? { n, of: d.of } : null }
    })
    .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || (b.progress ? b.progress.n / b.progress.of : 0) - (a.progress ? a.progress.n / a.progress.of : 0))
}

/** Best month (sessions in one calendar month), for a card's history. */
export const bestMonthOf = (rows: SessionRow[]) => statsOf(rows).bestMonth
