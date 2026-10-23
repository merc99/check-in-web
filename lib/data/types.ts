import type { BrandColor, TagColor } from '@/lib/colors'
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
  avatar_color: BrandColor | null
  timezone: string
  created_at: Timestamp
  deleted_at: Timestamp | null
}

export interface Group {
  id: UUID
  name: string
  description: string | null
  color: BrandColor
  invite_slug: string
  created_by: UUID | null
  max_members: number
  pinned_message: string | null
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
  color: TagColor
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
  created_at: Timestamp
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
  color: BrandColor
  photoUrl: string | null
}

export interface Me {
  profile: Profile
  person: Person
}

export interface GroupSummary {
  id: UUID
  name: string
  color: BrandColor
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
  /** Me first, then by join date. */
  members: MemberRow[]
  tags: Tag[]
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
  hearts: {
    count: number
    byMe: boolean
    /** Up to three other people who hearted, most recent first. */
    people: Person[]
  }
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
  color: BrandColor
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
  color: BrandColor
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
  group: { id: UUID; name: string; color: BrandColor }
  note: string | null
  tags: { id: UUID; name: string }[]
  createdAt: Timestamp
}

export interface Achievement {
  key: string
  title: string
  subtitle: string
  glyph: string
  color: BrandColor
  unlocked: boolean
}

export interface PublicProfile {
  person: Person
  memberSince: Timestamp
  total: number
  streak: number
  sharedGroups: { id: UUID; name: string; color: BrandColor; streak: number }[]
}

export interface CheckInInput {
  groupId: UUID
  note?: string
  /** Tag names. New names become new crew tags. */
  tags?: string[]
}

export interface NewGroupInput {
  name: string
  color: BrandColor
  maxMembers: number
}

export interface ProfilePatch {
  name?: string
  handle?: string | null
  bio?: string | null
  avatar_color?: BrandColor
  avatar_url?: string | null
}

export interface GroupPatch {
  name?: string
  color?: BrandColor
  pinned_message?: string | null
}
