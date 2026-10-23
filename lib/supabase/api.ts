import type { PostgrestError, RealtimeChannel } from '@supabase/supabase-js'
import { AVATAR_COLORS, GROUP_COLORS, getTagColor, type BrandColor } from '@/lib/colors'
import type {
  Achievement,
  Change,
  CheckInInput,
  ExploreDetail,
  ExploreGroup,
  FeedItem,
  Group,
  GroupDetail,
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
  RecentCheckIn,
  TableName,
  Tag,
  UUID,
} from '@/lib/data/types'
import { bestStreak, currentStreak, localDate } from '@/lib/dates'
import { supabase } from './client'

// Supabase implementation of the data API: the same exports as lib/mock/api.ts.
// Reads go through RLS-protected tables; anything that needs to see past RLS
// (streaks, explore, previews) or must be atomic (check in, heart) is an RPC
// from migration 018.

const sb = () => supabase()
const today = () => localDate(new Date())

// ─── Errors: database wording → brand voice ───

const FRIENDLY: Record<string, string> = {
  'Group not found': 'That code didn’t match a crew',
  'Group is full': 'That crew is full right now',
  'group is full': 'That crew is full right now',
  'not authorized': 'Only the person who started this crew can do that',
  'Not authenticated': 'Sign in first',
}

function toError(e: PostgrestError | Error | { message: string; code?: string }): Error {
  const code = 'code' in e ? e.code : undefined
  if (code === '23505') return new Error('That already exists')
  return new Error(FRIENDLY[e.message] ?? e.message)
}

function ok<T>(res: { data: T; error: PostgrestError | null }): T {
  if (res.error) throw toError(res.error)
  return res.data
}

async function me(): Promise<UUID> {
  const { data } = await sb().auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error('Sign in first')
  return id
}

// ─── Shapes ───

type ProfileRow = { id: UUID; name: string | null; avatar_color: string | null; avatar_url: string | null }
const PROFILE = 'id,name,avatar_color,avatar_url'

const asColor = (c: string | null | undefined, fallback: BrandColor = 'mint'): BrandColor =>
  GROUP_COLORS.includes(c as BrandColor) ? (c as BrandColor) : fallback

export function toPerson(p: ProfileRow | null | undefined): Person {
  return {
    id: p?.id ?? 'unknown',
    name: p?.name?.trim() || 'Member',
    color: asColor(p?.avatar_color),
    photoUrl: p?.avatar_url ?? null,
  }
}

type TagJoin = { tags: { id: UUID; name: string; deleted_at: string | null } | null }
const liveTags = (rows: TagJoin[] | null | undefined) =>
  (rows ?? []).flatMap((r) => (r.tags && !r.tags.deleted_at ? [{ id: r.tags.id, name: r.tags.name }] : []))

const FEED_SELECT = `
  id, user_id, group_id, local_date, note, created_at,
  author:profiles(${PROFILE}),
  check_in_tags(tags(id, name, deleted_at)),
  reactions(user_id, created_at, deleted_at, profiles(${PROFILE}))
`

type FeedRow = {
  id: UUID
  user_id: UUID
  group_id: UUID
  local_date: string
  note: string | null
  created_at: string
  author: ProfileRow | null
  check_in_tags: TagJoin[] | null
  reactions: { user_id: UUID; created_at: string; deleted_at: string | null; profiles: ProfileRow | null }[] | null
}

function toFeedItem(row: FeedRow, myId: UUID): FeedItem {
  const hearts = (row.reactions ?? []).filter((r) => !r.deleted_at).sort((a, b) => b.created_at.localeCompare(a.created_at))
  return {
    id: row.id,
    groupId: row.group_id,
    user: toPerson(row.author),
    isMine: row.user_id === myId,
    note: row.note,
    tags: liveTags(row.check_in_tags),
    createdAt: row.created_at,
    localDate: row.local_date,
    hearts: {
      count: hearts.length,
      byMe: hearts.some((h) => h.user_id === myId),
      people: hearts.filter((h) => h.user_id !== myId).slice(0, 3).map((h) => toPerson(h.profiles)),
    },
  }
}

async function feedItem(id: UUID): Promise<FeedItem | null> {
  const [myId, res] = await Promise.all([me(), sb().from('check_ins').select(FEED_SELECT).eq('id', id).is('deleted_at', null).maybeSingle()])
  const row = ok(res) as unknown as FeedRow | null
  return row ? toFeedItem(row, myId) : null
}

// ─── Realtime + local change events ───
// Screens refetch on these. Our own writes announce themselves right away; everyone
// else's arrive over a realtime channel (RLS decides what each person receives).

const listeners = new Set<(c: Change) => void>()
let channel: RealtimeChannel | null = null

function emit(change: Change) {
  listeners.forEach((l) => l(change))
}
const changed = (table: TableName, row: unknown = null, type: Change['type'] = 'UPDATE') => emit({ table, type, row })

function ensureChannel() {
  if (channel) return
  channel = sb()
    .channel('check-in-web')
    .on('postgres_changes', { event: '*', schema: 'public' }, (p) =>
      emit({ table: p.table as TableName, type: p.eventType, row: p.eventType === 'DELETE' ? p.old : p.new }),
    )
    .subscribe()
}

export function subscribe(listener: (change: Change) => void): () => void {
  ensureChannel()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function onCheckIn(groupId: UUID | null, listener: (item: FeedItem) => void): () => void {
  const seen = new Set<string>() // our own insert is announced locally and again by realtime
  return subscribe((c) => {
    if (c.table !== 'check_ins' || c.type !== 'INSERT' || !c.row) return
    const row = c.row as { id: UUID; group_id: UUID }
    if (seen.has(row.id) || (groupId && row.group_id !== groupId)) return
    seen.add(row.id)
    // RLS only returns it if it's in one of your crews.
    feedItem(row.id).then((item) => item && listener(item), () => {})
  })
}

export function onHeart(listener: (heart: { checkInId: UUID; groupId: UUID; person: Person }) => void): () => void {
  return subscribe((c) => {
    if (c.table !== 'reactions' || c.type === 'DELETE' || !c.row) return
    const row = c.row as { check_in_id: UUID; user_id: UUID; deleted_at: string | null }
    if (row.deleted_at) return
    ;(async () => {
      const myId = await me()
      if (row.user_id === myId) return
      const target = ok(await sb().from('check_ins').select('id,user_id,group_id').eq('id', row.check_in_id).maybeSingle())
      if (!target || target.user_id !== myId) return
      const p = ok(await sb().from('profiles').select(PROFILE).eq('id', row.user_id).maybeSingle())
      listener({ checkInId: target.id, groupId: target.group_id, person: toPerson(p) })
    })().catch(() => {})
  })
}

// ─── You ───

export async function getMe(): Promise<Me> {
  const id = await me()
  const p = ok(await sb().from('profiles').select('*').eq('id', id).single()) as Profile
  const profile: Profile = { ...p, avatar_color: p.avatar_color ? asColor(p.avatar_color) : null }
  return { profile, person: toPerson(profile) }
}

async function uploadAvatar(userId: UUID, dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob()
  const ext = (blob.type.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg')
  const path = `${userId}/avatar-${Date.now()}.${ext}`
  const { error } = await sb().storage.from('avatars').upload(path, blob, { contentType: blob.type, upsert: true })
  if (error) throw new Error('That photo didn’t upload. Try again.')
  return sb().storage.from('avatars').getPublicUrl(path).data.publicUrl
}

export async function updateProfile(patch: ProfilePatch): Promise<Me> {
  const id = await me()
  const update: Record<string, unknown> = {}
  if (patch.name !== undefined) {
    const name = patch.name.trim().slice(0, 40)
    if (!name) throw new Error('Name is required')
    update.name = name
  }
  if (patch.handle !== undefined) update.handle = patch.handle?.trim().replace(/^@/, '').slice(0, 24) || null
  if (patch.bio !== undefined) update.bio = patch.bio?.trim().slice(0, 140) || null
  if (patch.avatar_color !== undefined) {
    if (!AVATAR_COLORS.includes(patch.avatar_color)) throw new Error('Unknown avatar color')
    update.avatar_color = patch.avatar_color
  }
  if (patch.avatar_url !== undefined) {
    update.avatar_url = patch.avatar_url?.startsWith('data:') ? await uploadAvatar(id, patch.avatar_url) : patch.avatar_url
  }
  const res = await sb().from('profiles').update(update).eq('id', id)
  if (res.error) throw res.error.code === '23505' ? new Error('That handle is taken') : toError(res.error)
  changed('profiles')
  return getMe()
}

export async function deleteAccount(): Promise<void> {
  ok(await sb().rpc('delete_my_account'))
  await sb().auth.signOut()
}

async function myDays(id: UUID) {
  const res = await sb().from('check_ins').select('local_date', { count: 'exact' }).eq('user_id', id).is('deleted_at', null)
  const rows = ok(res) as { local_date: string }[]
  return { total: res.count ?? rows.length, days: new Set(rows.map((r) => r.local_date)) }
}

export async function getMyStats(): Promise<MyStats> {
  const { total, days } = await myDays(await me())
  return {
    total,
    streak: currentStreak(days),
    best: bestStreak(days),
    checkedInToday: days.has(today()),
    days: Array.from(days).sort(),
  }
}

export async function getMyRecentCheckIns(limit = 3): Promise<RecentCheckIn[]> {
  const id = await me()
  const rows = ok(
    await sb()
      .from('check_ins')
      .select('id, note, created_at, group_id, groups(id, name, color), check_in_tags(tags(id, name, deleted_at))')
      .eq('user_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit),
  ) as unknown as {
    id: UUID
    note: string | null
    created_at: string
    group_id: UUID
    groups: { id: UUID; name: string; color: string } | null
    check_in_tags: TagJoin[] | null
  }[]
  return rows.map((r) => ({
    id: r.id,
    group: { id: r.group_id, name: r.groups?.name ?? '', color: asColor(r.groups?.color) },
    note: r.note,
    tags: liveTags(r.check_in_tags),
    createdAt: r.created_at,
  }))
}

async function myGroupIds(id: UUID): Promise<UUID[]> {
  const rows = ok(await sb().from('group_members').select('group_id').eq('user_id', id).is('deleted_at', null)) as { group_id: UUID }[]
  return rows.map((r) => r.group_id)
}

export async function getAchievements(): Promise<Achievement[]> {
  const id = await me()
  const [{ total, days }, started, groupIds] = await Promise.all([
    myDays(id),
    sb().from('groups').select('id', { count: 'exact', head: true }).eq('created_by', id).is('deleted_at', null),
    myGroupIds(id),
  ])
  const best = bestStreak(days)
  const milestones = await Promise.all(groupIds.map((g) => sb().rpc('get_group_milestone_stats', { p_group_id: g })))
  const perfectDay = milestones.some((m) => (m.data as { has_perfect_day: boolean }[] | null)?.[0]?.has_perfect_day)
  const a = (key: string, title: string, subtitle: string, glyph: string, color: BrandColor, unlocked: boolean) => ({
    key, title, subtitle, glyph, color, unlocked,
  })
  return [
    a('first', 'First check-in', 'You showed up', '1', 'mint', total >= 1),
    a('starter', 'Crew starter', 'Started a crew', 'C', 'sky', (started.count ?? 0) > 0),
    a('forty', 'Forty deep', '40 check-ins', '40', 'lemon', total >= 40),
    a('week', 'Week one', '7 days in a row', '7', 'coral', best >= 7),
    a('fifty', 'Half century', '50 check-ins', '50', 'grape', total >= 50),
    a('perfect', 'Perfect day', 'Whole crew in, same day', '★', 'leaf', perfectDay),
  ]
}

export async function getUserProfile(userId: UUID): Promise<PublicProfile> {
  const p = ok(await sb().rpc('get_user_public_profile', { p_user_id: userId, p_today: today() })) as {
    id: UUID
    name: string | null
    avatar_color: string | null
    avatar_url: string | null
    member_since: string
    total_checkins: number
    streak: number
    shared_groups: { id: UUID; name: string; color: string; streak: number }[]
  } | null
  if (!p) throw new Error('That person isn’t here anymore')
  return {
    person: toPerson(p),
    memberSince: p.member_since,
    total: p.total_checkins,
    streak: p.streak,
    sharedGroups: (p.shared_groups ?? []).map((g) => ({ ...g, color: asColor(g.color) })),
  }
}

// ─── Crews ───

export async function getMyGroups(): Promise<GroupSummary[]> {
  const id = await me()
  const rows = ok(
    await sb()
      .from('group_members')
      .select('group_id, joined_at, groups(id, name, color, max_members, created_by, deleted_at)')
      .eq('user_id', id)
      .is('deleted_at', null)
      .order('joined_at'),
  ) as unknown as { groups: (Pick<Group, 'id' | 'name' | 'color' | 'max_members' | 'created_by' | 'deleted_at'>) | null }[]
  const groups = rows.flatMap((r) => (r.groups && !r.groups.deleted_at ? [r.groups] : []))
  if (!groups.length) return []
  const ids = groups.map((g) => g.id)
  const [members, todays] = await Promise.all([
    sb().from('group_members').select('group_id, user_id').in('group_id', ids).is('deleted_at', null),
    sb().from('check_ins').select('group_id, user_id').in('group_id', ids).eq('local_date', today()).is('deleted_at', null),
  ])
  const memberRows = ok(members) as { group_id: UUID; user_id: UUID }[]
  const todayRows = ok(todays) as { group_id: UUID; user_id: UUID }[]
  return groups.map((g) => {
    const crew = new Set(memberRows.filter((m) => m.group_id === g.id).map((m) => m.user_id))
    const inToday = new Set(todayRows.filter((c) => c.group_id === g.id && crew.has(c.user_id)).map((c) => c.user_id))
    return {
      id: g.id,
      name: g.name,
      color: asColor(g.color),
      memberCount: crew.size,
      maxMembers: g.max_members,
      inToday: inToday.size,
      isOwner: g.created_by === id,
    }
  })
}

export async function getGroup(groupId: UUID): Promise<GroupDetail> {
  const id = await me()
  const [groupRes, membersRes, streaksRes, todayRes, tagsRes] = await Promise.all([
    sb().from('groups').select('*').eq('id', groupId).is('deleted_at', null).maybeSingle(),
    sb().from('group_members').select(`user_id, joined_at, profiles(${PROFILE})`).eq('group_id', groupId).is('deleted_at', null).order('joined_at'),
    sb().rpc('get_group_streaks', { p_group_id: groupId, p_today: today() }),
    sb().from('check_ins').select('user_id').eq('group_id', groupId).eq('local_date', today()).is('deleted_at', null),
    sb().from('tags').select('*').eq('group_id', groupId).is('deleted_at', null).order('created_at'),
  ])
  const g = ok(groupRes) as Group | null
  if (!g) throw new Error('This crew isn’t here anymore')
  const members = ok(membersRes) as unknown as { user_id: UUID; profiles: ProfileRow | null }[]
  if (!members.some((m) => m.user_id === id)) throw new Error('This crew isn’t one of yours')
  const streaks = new Map(((ok(streaksRes) ?? []) as { user_id: UUID; streak: number }[]).map((s) => [s.user_id, s.streak]))
  const inToday = new Set((ok(todayRes) as { user_id: UUID }[]).map((r) => r.user_id))
  const rows = members
    .map((m) => ({
      person: toPerson(m.profiles ?? { id: m.user_id, name: null, avatar_color: null, avatar_url: null }),
      isMe: m.user_id === id,
      isCreator: g.created_by === m.user_id,
      streak: streaks.get(m.user_id) ?? 0,
      inToday: inToday.has(m.user_id),
    }))
    .sort((a, b) => Number(b.isMe) - Number(a.isMe))
  return {
    id: g.id,
    name: g.name,
    color: asColor(g.color),
    memberCount: rows.length,
    maxMembers: g.max_members,
    inToday: rows.filter((r) => r.inToday).length,
    isOwner: g.created_by === id,
    slug: g.invite_slug,
    description: g.description,
    pinnedMessage: g.pinned_message,
    isPublic: !!g.is_public,
    members: rows,
    tags: (ok(tagsRes) as Tag[]).map((t) => ({ ...t, color: getTagColor(t.name) })),
  }
}

const SLUG_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const newSlug = () => Array.from({ length: 6 }, () => SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)]).join('')

export async function createGroup(input: NewGroupInput): Promise<UUID> {
  await me()
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await sb().rpc('create_my_group', {
      p_name: input.name.trim(),
      p_invite_slug: newSlug(),
      p_color: input.color,
      p_max_members: input.maxMembers,
      p_is_public: false,
    })
    if (res.error?.code === '23505') continue // invite code collision: try another
    const id = ok(res) as UUID
    changed('groups', null, 'INSERT')
    changed('group_members', null, 'INSERT')
    return id
  }
  throw new Error('That didn’t go through. Try again.')
}

export async function joinGroupBySlug(slug: string): Promise<UUID> {
  const code = slug.trim().toUpperCase()
  ok(await sb().rpc('join_group_by_slug', { p_slug: code }))
  const preview = ok(await sb().rpc('get_group_preview', { p_slug: code })) as { id: UUID }[]
  changed('group_members', null, 'INSERT')
  return preview[0].id
}

export async function updateGroup(groupId: UUID, patch: GroupPatch): Promise<void> {
  const update: Record<string, unknown> = {}
  if (patch.name !== undefined) {
    const name = patch.name.trim().slice(0, 32)
    if (!name) throw new Error('Name is required')
    update.name = name
  }
  if (patch.color !== undefined) update.color = patch.color
  if (patch.pinned_message !== undefined) update.pinned_message = patch.pinned_message?.trim() || null
  if (patch.is_public !== undefined) update.is_public = patch.is_public
  const rows = ok(await sb().from('groups').update(update).eq('id', groupId).select('id'))
  if (!rows?.length) throw new Error(FRIENDLY['not authorized'])
  changed('groups')
}

export async function leaveGroup(groupId: UUID): Promise<void> {
  const id = await me()
  ok(await sb().from('group_members').update({ deleted_at: new Date().toISOString() }).eq('group_id', groupId).eq('user_id', id).is('deleted_at', null))
  changed('group_members')
}

export async function removeMember(groupId: UUID, userId: UUID): Promise<void> {
  ok(await sb().rpc('remove_group_member', { p_group_id: groupId, p_user_id: userId }))
  changed('group_members')
}

export async function deleteGroup(groupId: UUID): Promise<void> {
  ok(await sb().rpc('delete_my_group', { p_group_id: groupId }))
  changed('groups')
  changed('group_members')
}

// ─── Tags ───

export async function getTags(groupId: UUID): Promise<Tag[]> {
  const rows = ok(await sb().from('tags').select('*').eq('group_id', groupId).is('deleted_at', null).order('created_at')) as Tag[]
  return rows.map((t) => ({ ...t, color: getTagColor(t.name) }))
}

export async function addTag(groupId: UUID, name: string): Promise<Tag> {
  const clean = name.trim().toLowerCase().slice(0, 24)
  if (!clean) throw new Error('Tag name is required')
  const res = await sb().from('tags').insert({ group_id: groupId, name: clean, color: getTagColor(clean) }).select('*').single()
  if (res.error?.code === '23505') throw new Error('That tag already exists')
  const tag = ok(res) as Tag
  changed('tags', tag, 'INSERT')
  return tag
}

export async function deleteTags(groupId: UUID, tagIds: UUID[]): Promise<void> {
  if (!tagIds.length) return
  ok(await sb().from('tags').update({ deleted_at: new Date().toISOString() }).eq('group_id', groupId).in('id', tagIds))
  changed('tags')
}

// ─── Feed ───

export async function getFeed(groupId: UUID, { limit = 40 }: { limit?: number } = {}): Promise<FeedItem[]> {
  const [myId, res] = await Promise.all([
    me(),
    sb().from('check_ins').select(FEED_SELECT).eq('group_id', groupId).is('deleted_at', null).order('created_at', { ascending: false }).limit(limit),
  ])
  return (ok(res) as unknown as FeedRow[]).map((r) => toFeedItem(r, myId))
}

export async function checkIn(input: CheckInInput): Promise<FeedItem> {
  const names = Array.from(new Set((input.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean)))
  const id = ok(
    await sb().rpc('create_check_in', {
      p_group_id: input.groupId,
      p_local_date: today(),
      p_note: input.note?.trim() || null,
      p_tags: names.map((name) => ({ name, color: getTagColor(name) })),
    }),
  ) as UUID
  const item = await feedItem(id)
  if (!item) throw new Error('That didn’t go through. Try again.')
  changed('check_ins', { id, group_id: input.groupId, user_id: item.user.id }, 'INSERT')
  changed('tags')
  return item
}

export async function toggleHeart(checkInId: UUID): Promise<boolean> {
  const id = await me()
  const row = ok(await sb().from('reactions').select('deleted_at').eq('check_in_id', checkInId).eq('user_id', id).maybeSingle()) as
    | { deleted_at: string | null }
    | null
  const on = !(row && !row.deleted_at)
  ok(await sb().rpc('set_heart', { p_check_in_id: checkInId, p_on: on }))
  changed('reactions')
  return on
}

// ─── Join requests ───

export async function getJoinRequests(groupId: UUID): Promise<JoinRequestItem[]> {
  const id = await me()
  const g = ok(await sb().from('groups').select('created_by').eq('id', groupId).maybeSingle()) as { created_by: UUID | null } | null
  if (!g || g.created_by !== id) return []
  const rows = ok(
    await sb().from('join_requests').select(`id, user_id, profiles(${PROFILE})`).eq('group_id', groupId).eq('status', 'pending').order('created_at'),
  ) as unknown as { id: UUID; user_id: UUID; profiles: ProfileRow | null }[]
  const totals = await Promise.all(
    rows.map((r) => sb().rpc('get_user_public_profile', { p_user_id: r.user_id, p_today: today() })),
  )
  return rows.map((r, i) => ({
    id: r.id,
    groupId,
    person: toPerson(r.profiles ?? { id: r.user_id, name: null, avatar_color: null, avatar_url: null }),
    totalCheckIns: (totals[i].data as { total_checkins?: number } | null)?.total_checkins ?? 0,
  }))
}

export async function acceptJoinRequest(requestId: UUID): Promise<void> {
  ok(await sb().rpc('accept_join_request', { p_request_id: requestId }))
  changed('join_requests')
  changed('group_members')
}

export async function declineJoinRequest(requestId: UUID): Promise<void> {
  ok(await sb().rpc('decline_join_request', { p_request_id: requestId }))
  changed('join_requests')
}

export async function requestToJoin(groupId: UUID): Promise<void> {
  ok(await sb().rpc('request_to_join', { p_group_id: groupId }))
  changed('join_requests', null, 'INSERT')
}

// ─── Explore & invites ───

type ExploreRow = {
  id: UUID
  name: string
  color: string
  description: string | null
  max_members: number
  member_count: number
  streak: number
  preview: ProfileRow[]
  is_member: boolean
  has_pending: boolean
}

function membership(isMember: boolean, hasPending: boolean, count: number, max: number): MembershipStatus {
  if (isMember) return 'member'
  if (hasPending) return 'pending'
  if (count >= max) return 'full'
  return null
}

function toExplore(r: ExploreRow): ExploreGroup {
  return {
    id: r.id,
    name: r.name,
    color: asColor(r.color),
    description: r.description,
    memberCount: Number(r.member_count),
    maxMembers: r.max_members,
    streak: r.streak,
    preview: (r.preview ?? []).map(toPerson),
    status: membership(r.is_member, r.has_pending, Number(r.member_count), r.max_members),
  }
}

export async function getExploreGroups(query = ''): Promise<ExploreGroup[]> {
  const rows = ok(await sb().rpc('get_explore_groups', { p_today: today() })) as ExploreRow[]
  const q = query.trim().toLowerCase()
  return rows.map(toExplore).filter((g) => !q || `${g.name} ${g.description ?? ''}`.toLowerCase().includes(q))
}

export async function getExploreDetails(groupId: UUID): Promise<ExploreDetail> {
  const [id, crews, membersRes] = await Promise.all([
    me(),
    getExploreGroups(),
    sb().rpc('get_group_explore_details', { p_group_id: groupId, p_today: today() }),
  ])
  const crew = crews.find((c) => c.id === groupId)
  if (!crew) throw new Error('That crew isn’t listed anymore')
  const members = ok(membersRes) as { user_id: UUID; name: string; avatar_color: string; avatar_url: string | null; streak: number }[]
  return {
    ...crew,
    members: members.map((m) => ({
      person: toPerson({ id: m.user_id, name: m.name, avatar_color: m.avatar_color, avatar_url: m.avatar_url }),
      isMe: m.user_id === id,
      streak: m.streak,
    })),
  }
}

/** Works signed out. Avatars come back as initials + colors only. */
export async function getGroupPreview(slug: string): Promise<GroupPreview | null> {
  const rows = ok(await sb().rpc('get_group_preview', { p_slug: slug.trim().toUpperCase() })) as {
    id: UUID
    name: string
    color: string
    member_count: number
    max_members: number
    preview: { initial: string; color: string }[]
    is_member: boolean
    has_pending: boolean
  }[]
  const r = rows?.[0]
  if (!r) return null
  return {
    id: r.id,
    name: r.name,
    color: asColor(r.color),
    memberCount: Number(r.member_count),
    maxMembers: r.max_members,
    preview: (r.preview ?? []).map((p, i) => ({ id: `preview-${i}`, name: p.initial, color: asColor(p.color), photoUrl: null })),
    status: membership(r.is_member, r.has_pending, Number(r.member_count), r.max_members),
  }
}
