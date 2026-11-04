// Progression: the MMO layer on top of mastery (Ben, Nov 2026: rank up by showing up, flex what you
// earn). One account-wide level from XP, rank names along the way, and cosmetic rewards for your
// check-in card: a card finish, an avatar frame, a title and one showcase badge. XP never goes down,
// nothing expires and nothing is bought: every reward is earned by sessions, tiers or achievements.
import type { Hue } from './colors'
import { tierOf, type TierKey } from './mastery'

// ─── XP ───

/** What a session is worth. A plain check-in is the whole point; the extras are small thank-yous. */
export const XP = {
  session: 10,
  photo: 5,
  withCrew: 5,
  details: 5,
  achievement: 25,
} as const

/** Reaching a tier in a skill. */
export const TIER_XP: Record<TierKey, number> = {
  started: 10,
  habit: 50,
  committed: 150,
  seasoned: 300,
  expert: 600,
  master: 1500,
}

export const MAX_LEVEL = 50

/** Total XP needed to reach a level (level 1 is free). Gentle at first, a long road to 50. */
export const xpForLevel = (level: number) => 20 * level * (level - 1)

export function levelFor(xp: number): number {
  let l = 1
  while (l < MAX_LEVEL && xp >= xpForLevel(l + 1)) l++
  return l
}

// ─── Ranks ───

export const RANK_KEYS = ['newcomer', 'regular', 'mainstay', 'pillar', 'keystone', 'legend'] as const
export type RankKey = (typeof RANK_KEYS)[number]

export interface Rank {
  key: RankKey
  name: string
  /** First level of the rank. */
  from: number
  hue: Hue
}

/** Rank names say what you are to your crew, not how you compare to strangers. */
export const RANKS: Rank[] = [
  { key: 'newcomer', name: 'Newcomer', from: 1, hue: 'leaf' },
  { key: 'regular', name: 'Regular', from: 5, hue: 'sky' },
  { key: 'mainstay', name: 'Mainstay', from: 10, hue: 'coral' },
  { key: 'pillar', name: 'Pillar', from: 20, hue: 'indigo' },
  { key: 'keystone', name: 'Keystone', from: 30, hue: 'grape' },
  { key: 'legend', name: 'Legend', from: 40, hue: 'lemon' },
]

export const rankOf = (key: RankKey) => RANKS.find((r) => r.key === key)!
export function rankFor(level: number): Rank {
  let r = RANKS[0]
  for (const x of RANKS) if (level >= x.from) r = x
  return r
}

// ─── Rewards ───

export type Slot = 'card' | 'frame' | 'title' | 'badge'
export const SLOT_LABEL: Record<Slot, string> = { card: 'Card', frame: 'Frame', title: 'Title', badge: 'Badge' }

/** Post finishes (components/checkin/Finish.module.css). Static: nothing moves on a post. */
export type CardFinish = 'edge' | 'tint' | 'holo' | 'gilded' | 'aurora'
/** Avatar rings. */
export type FrameKey = 'ring' | 'foil' | 'gilded' | 'prism'

export type Unlock =
  | { kind: 'start' }
  | { kind: 'level'; level: number }
  | { kind: 'tier'; tier: TierKey }
  | { kind: 'achievement'; key: string; name: string }

export interface Reward {
  id: string
  slot: Exclude<Slot, 'badge'>
  name: string
  /** One line on what it is. */
  blurb: string
  unlock: Unlock
  /** The value it sets on the loadout (a finish, a frame, a title's text). */
  value: string
}

const lvl = (level: number): Unlock => ({ kind: 'level', level })
const ach = (key: string, name: string): Unlock => ({ kind: 'achievement', key, name })
const tier = (t: TierKey): Unlock => ({ kind: 'tier', tier: t })

export const REWARDS: Reward[] = [
  // Card finishes: how your check-ins look in the feed.
  { id: 'card.edge', slot: 'card', name: 'Signature edge', blurb: 'A hairline in your color', unlock: lvl(3), value: 'edge' },
  { id: 'card.tint', slot: 'card', name: 'Tinted', blurb: 'A wash of your color', unlock: lvl(8), value: 'tint' },
  { id: 'card.holo', slot: 'card', name: 'Holo', blurb: 'A still holo edge', unlock: tier('seasoned'), value: 'holo' },
  { id: 'card.gilded', slot: 'card', name: 'Gilded', blurb: 'A gold edge and a warm glow', unlock: lvl(20), value: 'gilded' },
  { id: 'card.aurora', slot: 'card', name: 'Aurora', blurb: 'Holo, with an aurora glow', unlock: lvl(35), value: 'aurora' },

  // Frames: the ring on your avatar, everywhere it shows.
  { id: 'frame.ring', slot: 'frame', name: 'Ring', blurb: 'A ring in your color', unlock: lvl(2), value: 'ring' },
  { id: 'frame.foil', slot: 'frame', name: 'Foil', blurb: 'A holo foil ring', unlock: tier('committed'), value: 'foil' },
  { id: 'frame.gilded', slot: 'frame', name: 'Gilded', blurb: 'A gold ring', unlock: lvl(15), value: 'gilded' },
  { id: 'frame.prism', slot: 'frame', name: 'Prism', blurb: 'A thick prism ring', unlock: tier('expert'), value: 'prism' },

  // Titles: one line under your name on every post.
  ...RANKS.map((r): Reward => ({ id: `title.${r.key}`, slot: 'title', name: r.name, blurb: `Rank, level ${r.from}`, unlock: r.from === 1 ? { kind: 'start' } : lvl(r.from), value: r.name })),
  { id: 'title.early', slot: 'title', name: 'Early bird', blurb: 'Five sessions before 7am', unlock: ach('early', 'Early bird'), value: 'Early bird' },
  { id: 'title.weekends', slot: 'title', name: 'Weekend regular', blurb: 'Four weekends', unlock: ach('weekends', 'Weekend regular'), value: 'Weekend regular' },
  { id: 'title.week', slot: 'title', name: 'Seven straight', blurb: 'Seven days running', unlock: ach('week', 'Full week'), value: 'Seven straight' },
  { id: 'title.month', slot: 'title', name: 'Big month', blurb: '15 sessions in a month', unlock: ach('month', 'Big month'), value: 'Big month' },
  { id: 'title.photo', slot: 'title', name: 'Receipts', blurb: 'A session with a photo', unlock: ach('photo', 'Pics or it didn’t happen'), value: 'Receipts' },
  { id: 'title.hundred', slot: 'title', name: 'Hundred club', blurb: '100 sessions in one skill', unlock: ach('hundred', 'Hundred club'), value: 'Hundred club' },
  { id: 'title.perfect', slot: 'title', name: 'All in', blurb: 'Your whole crew in, same day', unlock: ach('perfect', 'Perfect day'), value: 'All in' },
  { id: 'title.committed', slot: 'title', name: 'Committed', blurb: 'Reach Committed in a skill', unlock: tier('committed'), value: 'Committed' },
  { id: 'title.seasoned', slot: 'title', name: 'Seasoned', blurb: 'Reach Seasoned in a skill', unlock: tier('seasoned'), value: 'Seasoned' },
]

export const rewardOf = (id: string) => REWARDS.find((r) => r.id === id) ?? null

/** "Level 8", "Reach Seasoned", "Early bird". */
export function unlockLabel(u: Unlock): string {
  if (u.kind === 'start') return 'From the start'
  if (u.kind === 'level') return `Level ${u.level}`
  if (u.kind === 'tier') return `Reach ${tierOf(u.tier).name}`
  return `Badge: ${u.name}`
}

/** What you're wearing. Null slots are plain. */
export interface Loadout {
  card: CardFinish | null
  frame: FrameKey | null
  title: string | null
  /** A badge key (see BADGES / skill achievements). */
  badge: string | null
}

export const EMPTY_LOADOUT: Loadout = { card: null, frame: null, title: null, badge: null }

// ─── Badges ───

/**
 * Every achievement is a badge you can show. Hue and icon (a lucide name) are the placeholder art:
 * drop real art in `public/badges/<key>.png` and list it in lib/art.ts to replace the disc.
 */
export const BADGE_LOOK: Record<string, { hue: Hue; icon: BadgeIcon }> = {
  // Account-wide
  'all.first': { hue: 'rose', icon: 'sparkle' },
  'all.starter': { hue: 'sky', icon: 'flag' },
  'all.forty': { hue: 'lemon', icon: 'layers' },
  'all.week': { hue: 'coral', icon: 'flame' },
  'all.fifty': { hue: 'grape', icon: 'medal' },
  'all.perfect': { hue: 'leaf', icon: 'users' },
  // Per skill
  first: { hue: 'leaf', icon: 'sparkle' },
  three: { hue: 'sky', icon: 'flame' },
  ten: { hue: 'sky', icon: 'layers' },
  detail: { hue: 'indigo', icon: 'notebook' },
  week: { hue: 'coral', icon: 'flame' },
  month: { hue: 'grape', icon: 'calendar' },
  weekends: { hue: 'lemon', icon: 'sun' },
  early: { hue: 'lemon', icon: 'sunrise' },
  quarter: { hue: 'indigo', icon: 'layers' },
  photo: { hue: 'rose', icon: 'camera' },
  hundred: { hue: 'grape', icon: 'medal' },
  tenhours: { hue: 'clay', icon: 'clock' },
  thirty: { hue: 'coral', icon: 'timer' },
  strava5: { hue: 'coral', icon: 'route' },
  km50: { hue: 'leaf', icon: 'route' },
  km250: { hue: 'indigo', icon: 'mountain' },
  hour: { hue: 'grape', icon: 'timer' },
  twenty: { hue: 'sky', icon: 'timer' },
  songs5: { hue: 'rose', icon: 'music' },
  songs25: { hue: 'grape', icon: 'music' },
  music50h: { hue: 'indigo', icon: 'clock' },
  pages100: { hue: 'leaf', icon: 'book' },
  pages1k: { hue: 'grape', icon: 'book' },
  books3: { hue: 'clay', icon: 'library' },
  pieces10: { hue: 'rose', icon: 'brush' },
  art25h: { hue: 'grape', icon: 'clock' },
  deep: { hue: 'indigo', icon: 'target' },
}

export type BadgeIcon =
  | 'sparkle' | 'flag' | 'layers' | 'flame' | 'medal' | 'users' | 'notebook' | 'calendar' | 'sun' | 'sunrise'
  | 'camera' | 'clock' | 'timer' | 'route' | 'mountain' | 'music' | 'book' | 'library' | 'brush' | 'target'

export const badgeLook = (key: string) => BADGE_LOOK[key] ?? BADGE_LOOK[key.split(':').pop() ?? ''] ?? { hue: 'sky' as Hue, icon: 'medal' as BadgeIcon }
