import type { Hue } from '@/lib/colors'
import type { CrewPattern } from '@/lib/crewStyle'
import type { CheckInDetails, CheckInSource, SkillKind, TierKey } from '@/lib/mastery'
import type { LocalDate } from '@/lib/dates'

// ─── Rows: shaped exactly like the Supabase tables (snake_case, nullable where the column is) ───

export type UUID = string
export type Timestamp = string // ISO 8601, timestamptz

export interface Profile {
  id: UUID
  email: string
  name: string | null
  handle: string | null
  bio: string | null
  avatar_url: string | null
  avatar_color: Hue | null
  timezone: string
  created_at: Timestamp
  deleted_at: Timestamp | null
}

export interface Group {
  id: UUID
  name: string
  description: string | null
  color: Hue
  /** Shown on the crew's block instead of its first letter. */
  emoji: string | null
  /** The texture on the crew's banner and cards. */
  pattern: CrewPattern
  /** What the crew practises: decides the check-in detail fields and the skill in mastery tiers. */
  skill_kind: SkillKind
  /** A cover photo for the crew's Explore card, if it has one. */
  cover_url: string | null
  invite_slug: string
  created_by: UUID | null
  max_members: number
  pinned_message: string | null
  /** Listed in Explore. Crews are private until their creator turns this on. */
  is_public: boolean
  created_at: Timestamp
  deleted_at: Timestamp | null
}

export interface GroupMember {
  id: UUID
  user_id: UUID
  group_id: UUID
  role: 'admin' | 'mod' | 'member'
  joined_at: Timestamp
  streak_freeze_count: number
  deleted_at: Timestamp | null
}

export interface Tag {
  id: UUID
  group_id: UUID
  name: string
  color: Hue
  usage_count: number
  created_at: Timestamp
  deleted_at: Timestamp | null
}

export interface CheckIn {
  id: UUID
  user_id: UUID
  group_id: UUID
  local_date: LocalDate
  note: string | null
  /** Optional specifics (minutes, songs, book, distance...). */
  details: CheckInDetails | null
  /** Where it came from: typed in, or picked from a Strava activity. */
  source: CheckInSource
  created_at: Timestamp
  deleted_at: Timestamp | null
}

export interface CheckInTag {
  check_in_id: UUID
  tag_id: UUID
}

export interface Reaction {
  id: UUID
  check_in_id: UUID
  user_id: UUID
  /** One of lib/reactions.ts. A person can leave several different emoji on one check-in. */
  emoji: string
  created_at: Timestamp
  /** Taking a reaction back sets this; reacting again clears it. */
  deleted_at: Timestamp | null
}

export interface JoinRequest {
  id: UUID
  group_id: UUID
  user_id: UUID
  status: 'pending' | 'accepted' | 'declined'
  created_at: Timestamp
}

export interface Tables {
  profiles: Profile[]
  groups: Group[]
  group_members: GroupMember[]
  tags: Tag[]
  check_ins: CheckIn[]
  check_in_tags: CheckInTag[]
  reactions: Reaction[]
  join_requests: JoinRequest[]
}

export type TableName = keyof Tables

/** One row change, shaped like a Supabase realtime `postgres_changes` payload. */
export interface Change<T = unknown> {
  table: TableName
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  row: T
}

// ─── View models: what screens receive. Components never touch rows directly. ───

/** Everything an <Avatar> needs. */
export interface Person {
  id: UUID
  name: string
  color: Hue
  photoUrl: string | null
}

export interface Me {
  profile: Profile
  person: Person
}

export interface GroupSummary {
  id: UUID
  name: string
  color: Hue
  emoji: string | null
  pattern: CrewPattern
  skillKind: SkillKind
  memberCount: number
  maxMembers: number
  inToday: number
  isOwner: boolean
}

export interface MemberRow {
  person: Person
  isMe: boolean
  isCreator: boolean
  streak: number
  inToday: boolean
}

export interface GroupDetail extends GroupSummary {
  slug: string
  description: string | null
  pinnedMessage: string | null
  isPublic: boolean
  /** Me first, then by join date. */
  members: MemberRow[]
  tags: Tag[]
  /** Consecutive days with at least one member check-in. */
  streak: number
  /** Members who checked in on each of the last 14 days, oldest first (today last). */
  recent: number[]
}

export interface FeedItem {
  id: UUID
  groupId: UUID
  user: Person
  isMine: boolean
  note: string | null
  tags: { id: UUID; name: string }[]
  createdAt: Timestamp
  localDate: LocalDate
  /** The ❤️ reactions only (double-tap checks byMe). */
  hearts: {
    count: number
    byMe: boolean
    /** Up to three other people who hearted, most recent first. */
    people: Person[]
  }
  /** Every emoji on this check-in, in the order each was first left. */
  reactions: ReactionCount[]
  details: CheckInDetails | null
  source: CheckInSource
  /** The crew's skill (decides how details read). */
  skill: SkillKind
  /** Set when this session reached a tier: a milestone post. `sessions` is the count it reached. */
  milestone: { tier: TierKey; sessions: number } | null
}

export interface ReactionCount {
  emoji: string
  count: number
  /** You're one of the people who left it. */
  mine: boolean
  /** Everyone who left it, in the order they did (you included, marked isMe). */
  people: (Person & { isMe: boolean })[]
}

export interface JoinRequestItem {
  id: UUID
  groupId: UUID
  person: Person
  totalCheckIns: number
}

export type MembershipStatus = 'member' | 'pending' | 'full' | null

export interface ExploreGroup {
  id: UUID
  name: string
  color: Hue
  emoji: string | null
  pattern: CrewPattern
  coverUrl: string | null
  description: string | null
  memberCount: number
  maxMembers: number
  /** Consecutive days at least one member checked in. */
  streak: number
  preview: Person[]
  status: MembershipStatus
}

export interface ExploreDetail extends ExploreGroup {
  /** Longest personal streak first. */
  members: { person: Person; isMe: boolean; streak: number }[]
}

export interface GroupPreview {
  id: UUID
  name: string
  color: Hue
  emoji: string | null
  pattern: CrewPattern
  memberCount: number
  maxMembers: number
  preview: Person[]
  status: MembershipStatus
}

export interface MyStats {
  /** All-time. Never goes down. */
  total: number
  streak: number
  best: number
  checkedInToday: boolean
  /** Every local date with at least one check-in, any crew. */
  days: LocalDate[]
}

export interface RecentCheckIn {
  id: UUID
  group: { id: UUID; name: string; color: Hue }
  note: string | null
  tags: { id: UUID; name: string }[]
  createdAt: Timestamp
}

export interface Achievement {
  key: string
  title: string
  subtitle: string
  glyph: string
  color: Hue
  unlocked: boolean
}

export interface PublicProfile {
  person: Person
  memberSince: Timestamp
  total: number
  streak: number
  sharedGroups: { id: UUID; name: string; color: Hue; streak: number }[]
}

export interface CheckInInput {
  groupId: UUID
  note?: string
  /** Tag names. New names become new crew tags. */
  tags?: string[]
  details?: CheckInDetails | null
  source?: CheckInSource
}

export interface NewGroupInput {
  name: string
  color: Hue
  maxMembers: number
  skillKind?: SkillKind
}

export interface ProfilePatch {
  name?: string
  handle?: string | null
  bio?: string | null
  avatar_color?: Hue
  avatar_url?: string | null
}

export interface GroupPatch {
  name?: string
  color?: Hue
  emoji?: string | null
  pattern?: CrewPattern
  skill_kind?: SkillKind
  pinned_message?: string | null
  is_public?: boolean
}

/** A recent activity from Strava (sample data in the demo). */
export interface StravaActivity {
  id: string
  name: string
  /** Matches the check-in activity choices: Run, Walk, Ride, Swim... */
  type: string
  minutes: number
  distanceKm: number
  startedAt: Timestamp
}

/** One person's progress in one crew's skill (mastery tiers). */
export interface SkillProgress {
  groupId: UUID
  crewName: string
  color: Hue
  skill: SkillKind
  sessions: number
  /** Reached so far (null before the first session). */
  tier: TierKey | null
  /** The next tier and sessions to go (null at Master). */
  next: { tier: TierKey; toGo: number } | null
  /** When the current tier was reached. */
  tierReachedAt: Timestamp | null
}

/** A crew's last seven days, for the AI weekly recap. Plain values only (it's sent to the server). */
export interface CrewWeek {
  crewName: string
  memberCount: number
  /** Consecutive days with someone in. */
  streak: number
  /** Check-ins per member over the week, most first (everyone in the crew, zeros included). */
  perPerson: { name: string; isMe: boolean; count: number }[]
  /** Every check-in this week, oldest first. `day` is a weekday name, or "today". */
  checkIns: { name: string; isMe: boolean; day: string; note: string | null; tags: string[] }[]
}

/** The You dashboard. */
export interface MyInsights {
  /** Your check-ins per week for the last 12 weeks, oldest first (this week last). */
  weeks: number[]
  /** All-time check-ins in each crew you're in, most first. */
  byCrew: { id: UUID; name: string; color: Hue; count: number }[]
  /** Everyone in your crews, by current streak (any crew), then all-time count. */
  leaderboard: { person: Person; isMe: boolean; streak: number; total: number }[]
  thisMonth: number
  lastMonth: number
}
