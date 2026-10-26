import { AVATAR_HUES, getTagHue, type Hue } from '@/lib/colors'
import type {
  Achievement,
  Change,
  CheckIn,
  CheckInInput,
  ExploreDetail,
  ExploreGroup,
  FeedItem,
  Group,
  GroupDetail,
  GroupMember,
  GroupPatch,
  GroupPreview,
  GroupSummary,
  JoinRequestItem,
  Me,
  MembershipStatus,
  MyStats,
  NewGroupInput,
  Person,
  Profile,
  ProfilePatch,
  PublicProfile,
  Reaction,
  ReactionCount,
  MyInsights,
  RecentCheckIn,
  Tag,
  UUID,
} from '@/lib/data/types'
import { addDays, bestStreak, currentStreak, localDate, startOfDay, type LocalDate } from '@/lib/dates'
import { HEART, REACTIONS } from '@/lib/reactions'
import { db, emit, newId, nowIso, onChange, resetDb } from './db'
import { ME_ID } from './seed'

// Mock implementation of the data API. Every function is async and returns view
// models, so a real backend can replace these bodies (see the `supabase` branch) without
// touching a component. Errors mirror the RPCs' `raise exception` messages.

const LATENCY_MS = 0
const settle = () => new Promise<void>((r) => setTimeout(r, LATENCY_MS))

// ─── Row helpers ───

const alive = <T extends { deleted_at: string | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at)
const today = () => localDate(new Date())

function profile(id: UUID): Profile {
  const p = db().profiles.find((x) => x.id === id)
  if (!p) throw new Error('Profile not found')
  return p
}

export function toPerson(p: Profile): Person {
  return { id: p.id, name: p.name?.trim() || 'Member', color: p.avatar_color ?? 'leaf', photoUrl: p.avatar_url }
}
const personOf = (id: UUID) => toPerson(profile(id))

function group(id: UUID): Group {
  const g = db().groups.find((x) => x.id === id && !x.deleted_at)
  if (!g) throw new Error('Group not found')
  return g
}

const membersOf = (groupId: UUID): GroupMember[] =>
  alive(db().group_members)
    .filter((m) => m.group_id === groupId)
    .sort((a, b) => a.joined_at.localeCompare(b.joined_at))

const isMember = (userId: UUID, groupId: UUID) => membersOf(groupId).some((m) => m.user_id === userId)

function requireMember(groupId: UUID) {
  if (!isMember(ME_ID, groupId)) throw new Error('not authorized')
}
function requireOwner(groupId: UUID): Group {
  const g = group(groupId)
  if (g.created_by !== ME_ID) throw new Error('not authorized')
  return g
}

const checkInsOf = (filter: (c: CheckIn) => boolean) => alive(db().check_ins).filter(filter)

function daysOf(userId: UUID, groupId?: UUID): Set<LocalDate> {
  return new Set(checkInsOf((c) => c.user_id === userId && (!groupId || c.group_id === groupId)).map((c) => c.local_date))
}

const inToday = (userId: UUID, groupId: UUID) =>
  checkInsOf((c) => c.user_id === userId && c.group_id === groupId && c.local_date === today()).length > 0

/** Consecutive days with at least one member check-in (get_group_streak). */
function groupStreak(groupId: UUID): number {
  return currentStreak(new Set(checkInsOf((c) => c.group_id === groupId).map((c) => c.local_date)))
}

function tagsFor(checkInId: UUID) {
  const ids = new Set(db().check_in_tags.filter((ct) => ct.check_in_id === checkInId).map((ct) => ct.tag_id))
  return alive(db().tags)
    .filter((t) => ids.has(t.id))
    .map((t) => ({ id: t.id, name: t.name }))
}

function status(groupId: UUID): MembershipStatus {
  if (isMember(ME_ID, groupId)) return 'member'
  if (db().join_requests.some((r) => r.group_id === groupId && r.user_id === ME_ID && r.status === 'pending')) return 'pending'
  if (membersOf(groupId).length >= group(groupId).max_members) return 'full'
  return null
}

function summary(g: Group): GroupSummary {
  const members = membersOf(g.id)
  return {
    id: g.id,
    name: g.name,
    color: g.color,
    emoji: g.emoji,
    pattern: g.pattern,
    memberCount: members.length,
    maxMembers: g.max_members,
    inToday: members.filter((m) => inToday(m.user_id, g.id)).length,
    isOwner: g.created_by === ME_ID,
  }
}

function toFeedItem(c: CheckIn): FeedItem {
  const all = alive(db().reactions).filter((r) => r.check_in_id === c.id)
  const reactions = all.filter((r) => r.emoji === HEART).sort((a, b) => b.created_at.localeCompare(a.created_at))
  // One chip per emoji, in the order each was first left.
  const chips: ReactionCount[] = []
  for (const r of [...all].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const chip = chips.find((x) => x.emoji === r.emoji)
    if (chip) {
      chip.count++
      chip.mine ||= r.user_id === ME_ID
    } else chips.push({ emoji: r.emoji, count: 1, mine: r.user_id === ME_ID })
  }
  return {
    id: c.id,
    groupId: c.group_id,
    user: personOf(c.user_id),
    isMine: c.user_id === ME_ID,
    note: c.note,
    tags: tagsFor(c.id),
    createdAt: c.created_at,
    localDate: c.local_date,
    hearts: {
      count: reactions.length,
      byMe: reactions.some((r) => r.user_id === ME_ID),
      people: reactions.filter((r) => r.user_id !== ME_ID).slice(0, 3).map((r) => personOf(r.user_id)),
    },
    reactions: chips,
  }
}

function addMembership(userId: UUID, groupId: UUID) {
  const g = group(groupId)
  if (membersOf(groupId).length >= g.max_members) throw new Error('Group is full')
  const existing = db().group_members.find((m) => m.user_id === userId && m.group_id === groupId)
  if (existing) {
    existing.deleted_at = null
    existing.joined_at = nowIso()
    emit({ table: 'group_members', type: 'UPDATE', row: existing })
    return
  }
  const row: GroupMember = {
    id: newId(),
    user_id: userId,
    group_id: groupId,
    role: 'member',
    joined_at: nowIso(),
    streak_freeze_count: 0,
    deleted_at: null,
  }
  db().group_members.push(row)
  emit({ table: 'group_members', type: 'INSERT', row })
}

function findOrCreateTag(groupId: UUID, raw: string): Tag | null {
  const name = raw.trim().toLowerCase().slice(0, 24)
  if (!name) return null
  const existing = alive(db().tags).find((t) => t.group_id === groupId && t.name === name)
  if (existing) return existing
  const row: Tag = {
    id: newId(),
    group_id: groupId,
    name,
    color: getTagHue(name),
    usage_count: 0,
    created_at: nowIso(),
    deleted_at: null,
  }
  db().tags.push(row)
  emit({ table: 'tags', type: 'INSERT', row })
  return row
}

const SLUG_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
function uniqueSlug(): string {
  for (;;) {
    const slug = Array.from({ length: 6 }, () => SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)]).join('')
    if (!db().groups.some((g) => g.invite_slug === slug)) return slug
  }
}

// ─── Realtime ───

/** Every row change (INSERT / UPDATE / DELETE). Supabase: a realtime channel on these tables. */
export function subscribe(listener: (change: Change) => void): () => void {
  return onChange(listener)
}

/**
 * New check-ins as they arrive, in one crew or (with `null`) any crew you're in.
 * Drives the live arrival animation and the live pill.
 */
export function onCheckIn(groupId: UUID | null, listener: (item: FeedItem) => void): () => void {
  return onChange((c) => {
    if (c.table !== 'check_ins' || c.type !== 'INSERT') return
    const row = c.row as CheckIn
    if (groupId ? row.group_id === groupId : isMember(ME_ID, row.group_id)) listener(toFeedItem(row))
  })
}

/** Someone else reacted to one of your check-ins (a heart or any other emoji). */
export function onHeart(listener: (reaction: { checkInId: UUID; groupId: UUID; person: Person; emoji: string }) => void): () => void {
  return onChange((c) => {
    if (c.table !== 'reactions' || c.type === 'DELETE') return
    const row = c.row as Reaction
    if (row.deleted_at) return
    const target = db().check_ins.find((x) => x.id === row.check_in_id)
    if (!target || target.user_id !== ME_ID || row.user_id === ME_ID) return
    listener({ checkInId: target.id, groupId: target.group_id, person: personOf(row.user_id), emoji: row.emoji })
  })
}

// ─── You ───

export async function getMe(): Promise<Me> {
  await settle()
  const p = profile(ME_ID)
  return { profile: { ...p }, person: toPerson(p) }
}

export async function updateProfile(patch: ProfilePatch): Promise<Me> {
  await settle()
  const p = profile(ME_ID)
  if (patch.name !== undefined) {
    const name = patch.name.trim().slice(0, 40)
    if (!name) throw new Error('Name is required')
    p.name = name
  }
  if (patch.handle !== undefined) {
    const handle = patch.handle?.trim().replace(/^@/, '').slice(0, 24) || null
    if (handle && db().profiles.some((x) => x.id !== ME_ID && x.handle?.toLowerCase() === handle.toLowerCase())) {
      throw new Error('That handle is taken')
    }
    p.handle = handle
  }
  if (patch.bio !== undefined) p.bio = patch.bio?.trim().slice(0, 140) || null
  if (patch.avatar_color !== undefined) {
    if (!AVATAR_HUES.includes(patch.avatar_color)) throw new Error('Unknown avatar color')
    p.avatar_color = patch.avatar_color
  }
  if (patch.avatar_url !== undefined) p.avatar_url = patch.avatar_url
  emit({ table: 'profiles', type: 'UPDATE', row: p })
  return { profile: { ...p }, person: toPerson(p) }
}

/**
 * delete_my_account RPC. In the mock there's no "after", so it resets the demo
 * to its seeded state instead (the live prototype starts over for the visitor).
 */
export async function deleteAccount(): Promise<void> {
  await settle()
  resetDb()
}

export async function getMyStats(): Promise<MyStats> {
  await settle()
  const days = daysOf(ME_ID)
  return {
    total: checkInsOf((c) => c.user_id === ME_ID).length,
    streak: currentStreak(days),
    best: bestStreak(days),
    checkedInToday: days.has(today()),
    days: Array.from(days).sort(),
  }
}

export async function getMyInsights(): Promise<MyInsights> {
  await settle()
  const mine = checkInsOf((c) => c.user_id === ME_ID)
  const now = new Date()
  // Weeks start on Monday, like the heatmap.
  const monday = addDays(startOfDay(now), -((now.getDay() + 6) % 7))
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const from = localDate(addDays(monday, (i - 11) * 7))
    const to = localDate(addDays(monday, (i - 10) * 7))
    return mine.filter((c) => c.local_date >= from && c.local_date < to).length
  })
  const crews = alive(db().group_members).filter((m) => m.user_id === ME_ID).map((m) => group(m.group_id))
  const byCrew = crews
    .map((g) => ({ id: g.id, name: g.name, color: g.color, count: mine.filter((c) => c.group_id === g.id).length }))
    .sort((a, b) => b.count - a.count)
  const people = new Set(crews.flatMap((g) => membersOf(g.id).map((m) => m.user_id)))
  const leaderboard = Array.from(people)
    .map((uid) => ({ person: personOf(uid), isMe: uid === ME_ID, streak: currentStreak(daysOf(uid)), total: checkInsOf((c) => c.user_id === uid).length }))
    .sort((a, b) => b.streak - a.streak || b.total - a.total)
  const month = (d: Date) => localDate(d).slice(0, 7)
  const thisMonth = month(now)
  const lastMonth = month(new Date(now.getFullYear(), now.getMonth() - 1, 15))
  return {
    weeks,
    byCrew,
    leaderboard,
    thisMonth: mine.filter((c) => c.local_date.startsWith(thisMonth)).length,
    lastMonth: mine.filter((c) => c.local_date.startsWith(lastMonth)).length,
  }
}

export async function getMyRecentCheckIns(limit = 3): Promise<RecentCheckIn[]> {
  await settle()
  return checkInsOf((c) => c.user_id === ME_ID)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map((c) => {
      const g = db().groups.find((x) => x.id === c.group_id)
      return {
        id: c.id,
        group: { id: c.group_id, name: g?.name ?? '', color: g?.color ?? 'leaf' },
        note: c.note,
        tags: tagsFor(c.id),
        createdAt: c.created_at,
      }
    })
}

export async function getAchievements(): Promise<Achievement[]> {
  await settle()
  const days = daysOf(ME_ID)
  const total = checkInsOf((c) => c.user_id === ME_ID).length
  const best = bestStreak(days)
  const myGroups = alive(db().group_members).filter((m) => m.user_id === ME_ID).map((m) => m.group_id)
  const perfectDay = myGroups.some((gid) => {
    const members = new Set(membersOf(gid).map((m) => m.user_id))
    const byDay = new Map<string, Set<string>>()
    for (const c of checkInsOf((c) => c.group_id === gid && members.has(c.user_id))) {
      if (!byDay.has(c.local_date)) byDay.set(c.local_date, new Set())
      byDay.get(c.local_date)!.add(c.user_id)
    }
    return Array.from(byDay.values()).some((s) => s.size >= members.size)
  })
  const a = (key: string, title: string, subtitle: string, glyph: string, color: Hue, unlocked: boolean) => ({
    key,
    title,
    subtitle,
    glyph,
    color,
    unlocked,
  })
  return [
    a('first', 'First check-in', 'You showed up', '1', 'rose', total >= 1),
    a('starter', 'Crew starter', 'Started a crew', 'C', 'sky', alive(db().groups).some((g) => g.created_by === ME_ID)),
    a('forty', 'Forty deep', '40 check-ins', '40', 'lemon', total >= 40),
    a('week', 'Week one', '7 days in a row', '7', 'coral', best >= 7),
    a('fifty', 'Half century', '50 check-ins', '50', 'grape', total >= 50),
    a('perfect', 'Perfect day', 'Whole crew in, same day', '★', 'leaf', perfectDay),
  ]
}

export async function getUserProfile(userId: UUID): Promise<PublicProfile> {
  await settle()
  const p = profile(userId)
  const shared = alive(db().group_members)
    .filter((m) => m.user_id === userId && isMember(ME_ID, m.group_id))
    .map((m) => group(m.group_id))
  return {
    person: toPerson(p),
    memberSince: p.created_at,
    total: checkInsOf((c) => c.user_id === userId).length,
    streak: currentStreak(daysOf(userId)),
    sharedGroups: shared.map((g) => ({ id: g.id, name: g.name, color: g.color, streak: currentStreak(daysOf(userId, g.id)) })),
  }
}

// ─── Crews ───

export async function getMyGroups(): Promise<GroupSummary[]> {
  await settle()
  return alive(db().group_members)
    .filter((m) => m.user_id === ME_ID)
    .sort((a, b) => a.joined_at.localeCompare(b.joined_at))
    .map((m) => db().groups.find((g) => g.id === m.group_id && !g.deleted_at))
    .filter((g): g is Group => !!g)
    .map(summary)
}

export async function getGroup(groupId: UUID): Promise<GroupDetail> {
  await settle()
  requireMember(groupId)
  const g = group(groupId)
  const members = membersOf(groupId)
    .map((m) => ({
      person: personOf(m.user_id),
      isMe: m.user_id === ME_ID,
      isCreator: g.created_by === m.user_id,
      streak: currentStreak(daysOf(m.user_id, groupId)),
      inToday: inToday(m.user_id, groupId),
    }))
    .sort((a, b) => Number(b.isMe) - Number(a.isMe))
  return {
    ...summary(g),
    slug: g.invite_slug,
    description: g.description,
    pinnedMessage: g.pinned_message,
    isPublic: g.is_public,
    members,
    tags: alive(db().tags)
      .filter((t) => t.group_id === groupId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    streak: groupStreak(groupId),
    recent: Array.from({ length: 14 }, (_, i) => {
      const day = localDate(addDays(new Date(), i - 13))
      return new Set(checkInsOf((c) => c.group_id === groupId && c.local_date === day).map((c) => c.user_id)).size
    }),
  }
}

export async function createGroup(input: NewGroupInput): Promise<UUID> {
  await settle()
  const name = input.name.trim().slice(0, 32)
  if (!name) throw new Error('Name is required')
  const row: Group = {
    id: newId(),
    name,
    description: null,
    color: input.color,
    emoji: null,
    pattern: 'dots',
    cover_url: null,
    invite_slug: uniqueSlug(),
    created_by: ME_ID,
    max_members: input.maxMembers,
    pinned_message: null,
    is_public: false,
    created_at: nowIso(),
    deleted_at: null,
  }
  db().groups.push(row)
  emit({ table: 'groups', type: 'INSERT', row })
  addMembership(ME_ID, row.id)
  return row.id
}

/**
 * Join by invite code. Prototype behaviour: a code that matches no crew joins the
 * first open public crew instead, so anyone trying the demo gets somewhere.
 */
export async function joinGroupBySlug(slug: string): Promise<UUID> {
  await settle()
  const code = slug.trim().toUpperCase()
  const match = alive(db().groups).find((g) => g.invite_slug === code)
  const target =
    match ?? alive(db().groups).find((g) => !isMember(ME_ID, g.id) && membersOf(g.id).length < g.max_members)
  if (!target) throw new Error('Group not found')
  if (!isMember(ME_ID, target.id)) addMembership(ME_ID, target.id)
  return target.id
}

export async function updateGroup(groupId: UUID, patch: GroupPatch): Promise<void> {
  await settle()
  const g = requireOwner(groupId)
  if (patch.name !== undefined) {
    const name = patch.name.trim().slice(0, 32)
    if (!name) throw new Error('Name is required')
    g.name = name
  }
  if (patch.color !== undefined) g.color = patch.color
  if (patch.emoji !== undefined) g.emoji = patch.emoji
  if (patch.pattern !== undefined) g.pattern = patch.pattern
  if (patch.pinned_message !== undefined) g.pinned_message = patch.pinned_message?.trim() || null
  if (patch.is_public !== undefined) g.is_public = patch.is_public
  emit({ table: 'groups', type: 'UPDATE', row: g })
}

export async function leaveGroup(groupId: UUID): Promise<void> {
  await settle()
  const m = membersOf(groupId).find((x) => x.user_id === ME_ID)
  if (!m) return
  m.deleted_at = nowIso()
  emit({ table: 'group_members', type: 'UPDATE', row: m })
}

/** remove_group_member RPC. */
export async function removeMember(groupId: UUID, userId: UUID): Promise<void> {
  await settle()
  requireOwner(groupId)
  const m = membersOf(groupId).find((x) => x.user_id === userId)
  if (!m) return
  m.deleted_at = nowIso()
  emit({ table: 'group_members', type: 'UPDATE', row: m })
}

/** delete_my_group RPC: soft-deletes the crew and every membership. */
export async function deleteGroup(groupId: UUID): Promise<void> {
  await settle()
  const g = requireOwner(groupId)
  const at = nowIso()
  for (const m of membersOf(groupId)) {
    m.deleted_at = at
    emit({ table: 'group_members', type: 'UPDATE', row: m })
  }
  g.deleted_at = at
  emit({ table: 'groups', type: 'UPDATE', row: g })
}

// ─── Tags ───

export async function getTags(groupId: UUID): Promise<Tag[]> {
  await settle()
  requireMember(groupId)
  return alive(db().tags)
    .filter((t) => t.group_id === groupId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function addTag(groupId: UUID, name: string): Promise<Tag> {
  await settle()
  requireMember(groupId)
  const clean = name.trim().toLowerCase()
  if (alive(db().tags).some((t) => t.group_id === groupId && t.name === clean)) throw new Error('That tag already exists')
  const tag = findOrCreateTag(groupId, clean)
  if (!tag) throw new Error('Tag name is required')
  return tag
}

/** Soft delete. Past check-ins keep their tag rows; feeds stop showing deleted tags. */
export async function deleteTags(groupId: UUID, tagIds: UUID[]): Promise<void> {
  await settle()
  requireMember(groupId)
  const at = nowIso()
  for (const t of alive(db().tags)) {
    if (t.group_id === groupId && tagIds.includes(t.id)) {
      t.deleted_at = at
      emit({ table: 'tags', type: 'UPDATE', row: t })
    }
  }
}

// ─── Feed ───

export async function getFeed(groupId: UUID, { limit = 40 }: { limit?: number } = {}): Promise<FeedItem[]> {
  await settle()
  requireMember(groupId)
  return checkInsOf((c) => c.group_id === groupId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map(toFeedItem)
}

/** Also used by the live simulation to post as other crew members. */
export function insertCheckIn(userId: UUID, input: CheckInInput): FeedItem {
  if (!isMember(userId, input.groupId)) throw new Error('not authorized')
  if (inToday(userId, input.groupId)) throw new Error('You’re in for today')
  const row: CheckIn = {
    id: newId(),
    user_id: userId,
    group_id: input.groupId,
    local_date: today(),
    note: input.note?.trim().slice(0, 280) || null,
    created_at: nowIso(),
    deleted_at: null,
  }
  const names = Array.from(new Set((input.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean)))
  for (const name of names) {
    const tag = findOrCreateTag(input.groupId, name)
    if (!tag) continue
    db().check_in_tags.push({ check_in_id: row.id, tag_id: tag.id })
    tag.usage_count++
  }
  db().check_ins.push(row)
  emit({ table: 'check_ins', type: 'INSERT', row })
  return toFeedItem(row)
}

export async function checkIn(input: CheckInInput): Promise<FeedItem> {
  await settle()
  return insertCheckIn(ME_ID, input)
}

/** Also used by the live simulation. Returns whether `userId` now has `emoji` on it. */
export function setReaction(userId: UUID, checkInId: UUID, emoji: string, on: boolean): boolean {
  const c = alive(db().check_ins).find((x) => x.id === checkInId)
  if (!c || !isMember(userId, c.group_id)) throw new Error('not authorized')
  if (!REACTIONS.some((r) => r.emoji === emoji)) throw new Error('unknown reaction')
  // set_reaction RPC: one row per person per check-in per emoji, soft-deleted when taken back.
  const row = db().reactions.find((r) => r.check_in_id === checkInId && r.user_id === userId && r.emoji === emoji)
  if (on && !row) {
    const fresh = { id: newId(), check_in_id: checkInId, user_id: userId, emoji, created_at: nowIso(), deleted_at: null }
    db().reactions.push(fresh)
    emit({ table: 'reactions', type: 'INSERT', row: fresh })
  } else if (row && on === !!row.deleted_at) {
    row.deleted_at = on ? null : nowIso()
    if (on) row.created_at = nowIso()
    emit({ table: 'reactions', type: 'UPDATE', row })
  }
  return on
}

export function setHeart(userId: UUID, checkInId: UUID, on: boolean): boolean {
  return setReaction(userId, checkInId, HEART, on)
}

export async function toggleHeart(checkInId: UUID): Promise<boolean> {
  await settle()
  const on = !alive(db().reactions).some((r) => r.check_in_id === checkInId && r.user_id === ME_ID && r.emoji === HEART)
  return setHeart(ME_ID, checkInId, on)
}

/** Add (`on`) or take back your `emoji` on a check-in. */
export async function react(checkInId: UUID, emoji: string, on: boolean): Promise<boolean> {
  await settle()
  return setReaction(ME_ID, checkInId, emoji, on)
}

// ─── Join requests ───

/** Pending requests for a crew you started. Empty for everyone else. */
export async function getJoinRequests(groupId: UUID): Promise<JoinRequestItem[]> {
  await settle()
  if (group(groupId).created_by !== ME_ID) return []
  return db()
    .join_requests.filter((r) => r.group_id === groupId && r.status === 'pending')
    .map((r) => ({
      id: r.id,
      groupId,
      person: personOf(r.user_id),
      totalCheckIns: checkInsOf((c) => c.user_id === r.user_id).length,
    }))
}

export async function acceptJoinRequest(requestId: UUID): Promise<void> {
  await settle()
  const r = db().join_requests.find((x) => x.id === requestId && x.status === 'pending')
  if (!r) throw new Error('not authorized or request not found')
  requireOwner(r.group_id)
  addMembership(r.user_id, r.group_id)
  r.status = 'accepted'
  emit({ table: 'join_requests', type: 'UPDATE', row: r })
}

export async function declineJoinRequest(requestId: UUID): Promise<void> {
  await settle()
  const r = db().join_requests.find((x) => x.id === requestId && x.status === 'pending')
  if (!r) return
  requireOwner(r.group_id)
  r.status = 'declined'
  emit({ table: 'join_requests', type: 'UPDATE', row: r })
}

export async function requestToJoin(groupId: UUID): Promise<void> {
  await settle()
  if (!group(groupId).is_public) throw new Error('Group not found')
  const s = status(groupId)
  if (s === 'member' || s === 'pending') return
  if (s === 'full') throw new Error('Group is full')
  const existing = db().join_requests.find((r) => r.group_id === groupId && r.user_id === ME_ID)
  if (existing) {
    existing.status = 'pending'
    existing.created_at = nowIso()
    emit({ table: 'join_requests', type: 'UPDATE', row: existing })
    return
  }
  const row = { id: newId(), group_id: groupId, user_id: ME_ID, status: 'pending' as const, created_at: nowIso() }
  db().join_requests.push(row)
  emit({ table: 'join_requests', type: 'INSERT', row })
}

// ─── Explore & invites ───

function exploreGroup(g: Group): ExploreGroup {
  const members = membersOf(g.id)
  return {
    id: g.id,
    name: g.name,
    color: g.color,
    emoji: g.emoji,
    pattern: g.pattern,
    coverUrl: g.cover_url,
    description: g.description,
    memberCount: members.length,
    maxMembers: g.max_members,
    streak: groupStreak(g.id),
    preview: members.slice(0, 4).map((m) => personOf(m.user_id)),
    status: status(g.id),
  }
}

/** get_explore_groups RPC: public crews only, biggest first. */
export async function getExploreGroups(query = ''): Promise<ExploreGroup[]> {
  await settle()
  const q = query.trim().toLowerCase()
  return alive(db().groups)
    .filter((g) => g.is_public)
    .filter((g) => !q || `${g.name} ${g.description ?? ''}`.toLowerCase().includes(q))
    .map(exploreGroup)
    .sort((a, b) => b.memberCount - a.memberCount)
}

/** get_group_explore_details RPC. */
export async function getExploreDetails(groupId: UUID): Promise<ExploreDetail> {
  await settle()
  const g = group(groupId)
  if (!g.is_public && !isMember(ME_ID, groupId)) throw new Error('Group not found')
  return {
    ...exploreGroup(g),
    members: membersOf(groupId)
      .map((m) => ({ person: personOf(m.user_id), isMe: m.user_id === ME_ID, streak: currentStreak(daysOf(m.user_id, groupId)) }))
      .sort((a, b) => b.streak - a.streak),
  }
}

/** get_group_preview RPC, for /invite/[slug]. Works signed out. */
export async function getGroupPreview(slug: string): Promise<GroupPreview | null> {
  await settle()
  const g = alive(db().groups).find((x) => x.invite_slug === slug.trim().toUpperCase())
  if (!g) return null
  const members = membersOf(g.id)
  return {
    id: g.id,
    name: g.name,
    color: g.color,
    emoji: g.emoji,
    pattern: g.pattern,
    memberCount: members.length,
    maxMembers: g.max_members,
    preview: members.slice(0, 5).map((m) => personOf(m.user_id)),
    status: status(g.id),
  }
}
