// The mastery layer: every crew is a skill, every check-in is a session, and sessions climb a
// ladder of tiers. See docs/ideas/mastery-layer.md and mastery-slice-1-plan.md.

export const SKILL_KINDS = ['fitness', 'music', 'reading', 'art', 'writing', 'mind', 'health', 'other'] as const
export type SkillKind = (typeof SKILL_KINDS)[number]

export const SKILL_LABEL: Record<SkillKind, string> = {
  fitness: 'Fitness',
  music: 'Music',
  reading: 'Reading',
  art: 'Art',
  writing: 'Writing',
  mind: 'Mind',
  health: 'Health',
  other: 'Other',
}

/** The practice word for each skill, for copy like "50 lifting sessions". */
export const SKILL_NOUN: Record<SkillKind, string> = {
  fitness: 'training',
  music: 'practice',
  reading: 'reading',
  art: 'art',
  writing: 'writing',
  mind: 'focus',
  health: 'health',
  other: '',
}

export const TIER_KEYS = ['started', 'habit', 'committed', 'seasoned', 'expert', 'master'] as const
export type TierKey = (typeof TIER_KEYS)[number]

export interface Tier {
  key: TierKey
  name: string
  /** Sessions needed to reach it. */
  at: number
  /** The card material (components/checkin/TierCard). */
  material: 'paper' | 'enamel' | 'foil' | 'holo' | 'aurora' | 'master'
}

/** Early tiers come fast; Expert is a year of sessions; Master is a thousand. */
export const TIERS: Tier[] = [
  { key: 'started', name: 'Started', at: 1, material: 'paper' },
  { key: 'habit', name: 'Habit', at: 10, material: 'enamel' },
  { key: 'committed', name: 'Committed', at: 50, material: 'foil' },
  { key: 'seasoned', name: 'Seasoned', at: 150, material: 'holo' },
  { key: 'expert', name: 'Expert', at: 365, material: 'aurora' },
  { key: 'master', name: 'Master', at: 1000, material: 'master' },
]

export const tierOf = (key: TierKey) => TIERS.find((t) => t.key === key)!

/** The tier a session count has reached (null before the first session). */
export function tierFor(sessions: number): Tier | null {
  let reached: Tier | null = null
  for (const t of TIERS) if (sessions >= t.at) reached = t
  return reached
}

/** The next tier and how many sessions to go (null at Master). */
export function nextTier(sessions: number): { tier: Tier; toGo: number } | null {
  const t = TIERS.find((x) => x.at > sessions)
  return t ? { tier: t, toGo: t.at - sessions } : null
}

/** The tier a session lands on exactly, if it's a tier-up (the 10th session reaches Habit). */
export const tierReachedAt = (sessionNumber: number): Tier | null => TIERS.find((t) => t.at === sessionNumber) ?? null

/** Optional specifics on a check-in. Which ones a check-in offers depends on the crew's skill. */
export interface CheckInDetails {
  minutes?: number
  /** Songs, exercises, pieces: short labels. */
  items?: string[]
  book?: string
  pages?: number
  activity?: string
  distanceKm?: number
}

export type CheckInSource = 'manual' | 'strava'

/** The detail fields each skill offers in the check-in sheet. */
export const DETAIL_FIELDS: Record<SkillKind, (keyof CheckInDetails)[]> = {
  fitness: ['activity', 'minutes', 'distanceKm'],
  music: ['minutes', 'items'],
  reading: ['book', 'pages'],
  art: ['minutes', 'items'],
  writing: ['minutes'],
  mind: ['minutes'],
  health: ['minutes'],
  other: ['minutes'],
}

/** Drops empty fields; null if nothing is left. */
export function cleanDetails(d: CheckInDetails | null | undefined): CheckInDetails | null {
  if (!d) return null
  const out: CheckInDetails = {}
  if (d.minutes && d.minutes > 0) out.minutes = Math.min(Math.round(d.minutes), 24 * 60)
  if (d.items?.length) out.items = d.items.map((s) => s.trim().slice(0, 40)).filter(Boolean).slice(0, 6)
  if (d.book?.trim()) out.book = d.book.trim().slice(0, 80)
  if (d.pages && d.pages > 0) out.pages = Math.min(Math.round(d.pages), 5000)
  if (d.activity?.trim()) out.activity = d.activity.trim().slice(0, 40)
  if (d.distanceKm && d.distanceKm > 0) out.distanceKm = Math.round(Math.min(d.distanceKm, 1000) * 10) / 10
  if (out.items && !out.items.length) delete out.items
  return Object.keys(out).length ? out : null
}
