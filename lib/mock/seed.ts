import { getTagHue, type Hue } from '@/lib/colors'
import type { CrewPattern } from '@/lib/crewStyle'
import { TIERS, type CheckInDetails, type CheckInSource, type SkillKind } from '@/lib/mastery'
import type { CheckIn, Group, GroupMember, Profile, Reaction, Tables, Tag, Vouch } from '@/lib/data/types'
import { addDays, DAY, HOUR, localDate, MINUTE, startOfDay } from '@/lib/dates'
import { HEART } from '@/lib/reactions'

const SEED_EMOJI = ['💪', '🔥', '👏', '🙌', '🙏', '😅']

// Seeded like the prototype: the DIALED and Sketchbook Daily crews you're in,
// five public crews to explore, and months of history behind everyone's streaks.
// Everything is relative to "now", so the feed always looks like today.

export const ME_ID = 'me'

interface PersonSeed {
  id: string
  name: string
  color: Hue
  /** Days since they signed up. */
  joined: number
  streak: number
  total: number
  /** A past run longer than the current streak (only matters for you: "best streak"). */
  bestRun?: number
  /**
   * Exact sessions per crew (mastery tiers), instead of spreading `total` at random. Set for people the
   * demo needs at a particular tier: you at Committed in DIALED and one session from Habit in Sketchbook
   * Daily; Dre one session from Committed, so his next check-in is a milestone post.
   */
  sessions?: Record<string, number>
  handle?: string
  bio?: string
}

const PEOPLE: PersonSeed[] = [
  { id: ME_ID, name: 'Ben', color: 'leaf', joined: 120, streak: 6, total: 70, bestRun: 14, handle: 'benwoods', bio: 'Showing up, mostly.', sessions: { g1: 61, g2: 9 } },
  { id: 'u1', name: 'Maya', color: 'coral', joined: 200, streak: 12, total: 152, sessions: { g1: 152 } },
  { id: 'u2', name: 'Dre', color: 'sky', joined: 100, streak: 4, total: 49, sessions: { g1: 49 } },
  { id: 'u3', name: 'Priya', color: 'grape', joined: 190, streak: 21, total: 112 },
  { id: 'u4', name: 'Sam', color: 'lemon', joined: 160, streak: 0, total: 54 },
  { id: 'u5', name: 'Theo', color: 'leaf', joined: 70, streak: 9, total: 30 },
  { id: 'u6', name: 'Juno', color: 'rose', joined: 40, streak: 2, total: 19 },
  { id: 'u7', name: 'Jordan', color: 'indigo', joined: 10, streak: 0, total: 3 },
  { id: 'u8', name: 'Ruth', color: 'coral', joined: 220, streak: 33, total: 140 },
  { id: 'u9', name: 'Kofi', color: 'leaf', joined: 160, streak: 7, total: 61 },
  { id: 'u10', name: 'Lena', color: 'sky', joined: 130, streak: 15, total: 77 },
  { id: 'u11', name: 'Marco', color: 'clay', joined: 75, streak: 3, total: 22 },
  { id: 'u12', name: 'Ivy', color: 'rose', joined: 100, streak: 11, total: 48 },
  { id: 'u13', name: 'Ash', color: 'indigo', joined: 35, streak: 5, total: 26 },
  { id: 'u14', name: 'Noor', color: 'lemon', joined: 190, streak: 19, total: 95 },
  { id: 'u15', name: 'Cal', color: 'grape', joined: 8, streak: 1, total: 9 },
]

interface GroupSeed {
  id: string
  name: string
  color: Hue
  emoji: string
  pattern: CrewPattern
  skill: SkillKind
  slug: string
  max: number
  createdBy: string
  description?: string
  pinned?: string
  members: string[]
  tags: string[]
}

const GROUPS: GroupSeed[] = [
  { id: 'g1', name: 'DIALED', color: 'sky', emoji: '💪', pattern: 'plain', skill: 'fitness', slug: 'LIFT05', max: 8, createdBy: ME_ID, pinned: 'Leg day is not optional. Love you all.', members: [ME_ID, 'u1', 'u2', 'u3', 'u4'], tags: ['leg day', 'run', 'pr', 'stretch', 'rest day', 'push'] },
  { id: 'g2', name: 'Sketchbook Daily', color: 'grape', emoji: '🎨', pattern: 'confetti', skill: 'art', slug: 'SKTCH7', max: 10, createdBy: 'u3', description: 'Draw something. Anything. Every day.', members: [ME_ID, 'u3', 'u5', 'u6'], tags: ['sketch', 'gouache', 'ink', 'study'] },
  { id: 'e1', name: 'Morning Pages', color: 'lemon', emoji: '📝', pattern: 'grid', skill: 'writing', slug: 'PAGES3', max: 10, createdBy: 'u8', description: 'Three pages, longhand, before anything else.', members: ['u8', 'u10', 'u12', 'u14'], tags: ['pages', 'longhand'] },
  { id: 'e2', name: 'Couch to 5K', color: 'leaf', emoji: '🏃', pattern: 'waves', skill: 'fitness', slug: 'RUN5KC', max: 8, createdBy: 'u9', description: 'Slow runs count. Walking breaks count.', members: ['u9', 'u11', 'u13', 'u15', 'u10', 'u8', 'u12', 'u14'], tags: ['run', 'walk-run', 'rest day'] },
  { id: 'e3', name: 'Hydration Station', color: 'sky', emoji: '💧', pattern: 'dots', skill: 'health', slug: 'WATER8', max: 15, createdBy: 'u10', description: 'Eight glasses. We remind each other.', members: ['u10', 'u13', 'u6', 'u7'], tags: ['water'] },
  { id: 'e4', name: 'No Phone Before 9', color: 'indigo', emoji: '📵', pattern: 'grid', skill: 'mind', slug: 'NOFON9', max: 10, createdBy: 'u11', description: 'Mornings belong to you, not the feed.', members: ['u11', 'u12', 'u9', 'u15', 'u14'], tags: ['no phone', 'reading'] },
  { id: 'e5', name: 'Guitar, 20 Minutes', color: 'clay', emoji: '🎸', pattern: 'waves', skill: 'music', slug: 'GTR20M', max: 5, createdBy: 'u15', description: 'Scales, songs, noodling. It all counts.', members: ['u15', 'u9'], tags: ['scales', 'songs'] },
]

type NoteSeed = [note: string, tags: string[]]

/** Notes the live simulation (and the seeded history) draws from, per crew. */
export const NOTES: Record<string, NoteSeed[]> = {
  g1: [
    ['Hill sprints. Never again until Thursday.', ['run']],
    ['Stretched for twenty. Hamstrings say thanks.', ['stretch']],
    ['Pull-ups, three sets of five. Up from three.', ['pr', 'push']],
    ['Showed up tired, left less tired.', []],
    ['Rest day, but I walked to the gym to say hi.', ['rest day']],
    ['Squats felt heavy. Did them anyway.', ['leg day']],
  ],
  g2: [
    ['Two thumbnails for the zine cover.', ['sketch']],
    ['Ink wash of the street outside.', ['ink']],
    ['Drew my coffee. Again.', ['sketch', 'study']],
    ['Hands are hard. Did ten of them.', ['study']],
  ],
  e1: [['Three pages. Mostly complaining. It helped.', ['pages']], ['Wrote before the kettle boiled.', ['longhand']]],
  e2: [['Week 3, day 2. Ran the whole second interval.', ['run']], ['Walk-run in the rain.', ['walk-run']]],
  e3: [['Eight glasses, no reminders needed.', ['water']]],
  e4: [['Read twenty pages instead of scrolling.', ['reading', 'no phone']], ['Phone stayed in the drawer till 9.', ['no phone']]],
  e5: [['C major scale, slowly. Then faster.', ['scales']], ['Learned the intro to a song I like.', ['songs']]],
  _: [['Done for today.', []], ['Short one, but it counts.', []]],
}

// Small deterministic PRNG so the seeded history is the same on every load.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createSeed(now: Date = new Date()): Tables {
  const rand = mulberry32(42)
  // A separate stream for reaction emoji, so adding them didn't reshuffle the rest of the demo.
  const emojiRand = mulberry32(7)
  const detailRand = mulberry32(99)
  const pickD = <T,>(a: readonly T[]) => a[Math.floor(detailRand() * a.length)]
  const sampleDetails = (skill: SkillKind): CheckInDetails => {
    const minutes = pickD([15, 20, 25, 30, 40, 45, 60, 75, 90])
    if (skill === 'fitness') {
      const activity = pickD(['Run', 'Run', 'Walk', 'Ride', 'Strength', 'Strength', 'Yoga'])
      const distanceKm = activity === 'Run' ? pickD([3.2, 4, 5, 5.5, 6.4, 8, 10]) : activity === 'Walk' ? pickD([2.1, 3, 4.2]) : activity === 'Ride' ? pickD([12, 18.4, 25, 32]) : undefined
      return { activity, minutes, ...(distanceKm && { distanceKm }) }
    }
    if (skill === 'music') return { minutes, items: [pickD(['C major scale', 'Wonderwall intro', 'Blackbird', 'Barre chords', 'Fingerpicking', 'Hotel California solo', 'G-C-D changes', 'Ear training'])] }
    if (skill === 'art') return { minutes, items: [pickD(['Gouache', 'Ink', 'Gesture drawing', 'Still life', 'Watercolour', 'Portrait', 'Thumbnails'])] }
    if (skill === 'reading') return { book: pickD(['The Creative Act', 'Atomic Habits', 'Piranesi', 'Dune']), pages: pickD([12, 20, 30, 45]) }
    return { minutes }
  }
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rand() * a.length)]
  const today = startOfDay(now)
  const iso = (d: Date) => d.toISOString()
  const daysAgo = (n: number) => iso(addDays(today, -n))

  const profiles: Profile[] = PEOPLE.map((p) => ({
    id: p.id,
    email: `${p.name.toLowerCase()}@example.com`,
    name: p.name,
    handle: p.handle ?? null,
    bio: p.bio ?? null,
    avatar_url: null,
    avatar_color: p.color,
    timezone: 'UTC',
    pinned_group_id: null,
    created_at: daysAgo(p.joined),
    deleted_at: null,
  }))

  const groups: Group[] = GROUPS.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description ?? null,
    color: g.color,
    emoji: g.emoji,
    pattern: g.pattern,
    skill_kind: g.skill,
    // Placeholder covers made with Higgsfield (public/covers), for the public crews.
    cover_url: ['e1', 'e2', 'e3', 'e4', 'e5', 'g2'].includes(g.id) ? `/covers/${g.id}.webp` : null,
    invite_slug: g.slug,
    created_by: g.createdBy,
    max_members: g.max,
    pinned_message: g.pinned ?? null,
    // Your own DIALED crew stays private; the rest are listed in Explore.
    is_public: g.id !== 'g1',
    created_at: daysAgo(230),
    deleted_at: null,
  }))

  const joinedOf = new Map(PEOPLE.map((p) => [p.id, p.joined]))
  const group_members: GroupMember[] = GROUPS.flatMap((g) =>
    g.members.map((uid, i) => ({
      id: `gm-${g.id}-${uid}`,
      user_id: uid,
      group_id: g.id,
      role: 'member' as const,
      // Keep the roster order: earlier in the list = joined earlier.
      joined_at: iso(new Date(addDays(today, -(joinedOf.get(uid) ?? 30)).getTime() + i * MINUTE)),
      streak_freeze_count: 0,
      deleted_at: null,
    })),
  )

  const tags: Tag[] = GROUPS.flatMap((g) =>
    g.tags.map((name) => ({
      id: `t-${g.id}-${name.replace(/\s+/g, '-')}`,
      group_id: g.id,
      name,
      color: getTagHue(name),
      usage_count: 0,
      created_at: daysAgo(200),
      deleted_at: null,
    })),
  )
  const tagId = (groupId: string, name: string) =>
    tags.find((t) => t.group_id === groupId && t.name === name)?.id

  const check_ins: CheckIn[] = []
  const check_in_tags: { check_in_id: string; tag_id: string }[] = []
  const reactions: Reaction[] = []
  const used = new Set<string>() // `${user}|${group}|${local_date}`

  const add = (
    id: string,
    userId: string,
    groupId: string,
    at: Date,
    note: string,
    tagNames: string[],
    hearts: string[],
    details: CheckInDetails | null = null,
    source: CheckInSource = 'manual',
  ) => {
    const day = localDate(at)
    const key = `${userId}|${groupId}|${day}`
    if (used.has(key)) return false
    used.add(key)
    check_ins.push({ id, user_id: userId, group_id: groupId, local_date: day, note: note || null, details, source, photo_url: null, created_at: iso(at), deleted_at: null })
    for (const name of tagNames) {
      const t = tagId(groupId, name)
      if (t) check_in_tags.push({ check_in_id: id, tag_id: t })
    }
    // Mostly hearts, with some of the crew set mixed in (a person leaves one emoji here).
    hearts.forEach((uid, i) =>
      reactions.push({
        id: `r-${id}-${uid}`,
        check_in_id: id,
        user_id: uid,
        emoji: emojiRand() < 0.55 ? HEART : SEED_EMOJI[Math.floor(emojiRand() * SEED_EMOJI.length)],
        created_at: iso(new Date(at.getTime() + (i + 1) * 7 * MINUTE)),
        deleted_at: null,
      }),
    )
    return true
  }

  // The posts the prototype shows by name. `ago` < 1 day lands today (after midnight), else yesterday evening.
  const nowMs = now.getTime()
  const sod = today.getTime()
  const at = (ago: number) =>
    new Date(
      ago < DAY
        ? Math.min(Math.max(nowMs - ago, sod + Math.min(ago, HOUR) / 10), nowMs - MINUTE)
        : sod - (ago - DAY) - 2 * HOUR,
    )
  add('c1', 'u1', 'g1', at(40 * MINUTE), '5x5 squats, finally felt smooth. Coffee is earned.', ['leg day', 'pr'], ['u2', 'u3'], { activity: 'Strength', minutes: 55 })
  add('c3', 'u3', 'g1', at(5 * HOUR), '', ['stretch'], ['u1'])
  add('c4', ME_ID, 'g1', at(DAY + 2 * HOUR), 'Bench and rows. Shoulder felt fine for once.', ['push'], ['u1', 'u3', 'u4'], { activity: 'Strength', minutes: 60 })
  add('c5', 'u4', 'g1', at(DAY + 5 * HOUR), 'Rest day. Walked the dog twice, counts in my book.', ['rest day'], [ME_ID, 'u1'], { activity: 'Walk', minutes: 48, distanceKm: 4.2 }, 'strava')
  add('c6', 'u1', 'g1', at(DAY + 9 * HOUR), 'Deadlifts. Did not die.', ['pr'], ['u2'])
  add('c7', 'u3', 'g2', at(2 * HOUR), 'Gouache study of the plant by my window.', ['gouache', 'study'], ['u5', 'u6'], { minutes: 40, items: ['Gouache', 'Plant study'] })
  add('c8', 'u5', 'g2', at(6 * HOUR), 'Ten minutes of gesture drawings at the coffee shop.', ['sketch'], ['u3'])
  add('c9', ME_ID, 'g2', at(DAY + 3 * HOUR), 'Inked the cat. The cat did not cooperate.', ['ink'], ['u3', 'u5', 'u6'])

  // History: each person's current streak (in every crew they're in), your one longer past run,
  // then scattered older days in their first crew until their all-time total is reached.
  const groupsOf = (uid: string) => GROUPS.filter((g) => g.members.includes(uid)).map((g) => g.id)
  const membersOf = (gid: string) => GROUPS.find((g) => g.id === gid)?.members ?? []
  let n = 0
  const generated = (uid: string, gid: string, offset: number) => {
    const d = addDays(today, -offset)
    d.setHours(6 + Math.floor(rand() * 15), Math.floor(rand() * 60))
    const [note, tagNames] = rand() < 0.35 ? ['', []] : pick(NOTES[gid] ?? NOTES._)
    const others = membersOf(gid).filter((m) => m !== uid)
    const hearts = others.filter(() => rand() < 0.3).slice(0, 3)
    // About half of older sessions carry details for the crew's skill, so per-skill achievements have
    // something to count (a separate stream, so the rest of the history stays as it was).
    const det = detailRand() < 0.5 ? sampleDetails(GROUPS.find((g) => g.id === gid)?.skill ?? 'other') : null
    const strava = !!det?.distanceKm && detailRand() < 0.5
    return add(`h${++n}`, uid, gid, d, note, rand() < 0.5 ? tagNames : tagNames.slice(0, 1), hearts, det, strava ? 'strava' : 'manual')
  }

  for (const p of PEOPLE) {
    const gs = groupsOf(p.id)
    if (!gs.length) continue
    if (p.sessions) {
      // Exact sessions per crew: the streak first, your longer past run in the first crew, then older days.
      const base = p.streak + 2 + (p.bestRun ? p.bestRun + 1 : 0)
      for (const gid of gs) {
        const target = p.sessions[gid] ?? 0
        let c = check_ins.filter((x) => x.user_id === p.id && x.group_id === gid).length
        const tryG = (off: number) => {
          if (c < target && off <= p.joined && generated(p.id, gid, off)) c++
        }
        for (let off = 1; off <= p.streak; off++) tryG(off)
        if (p.bestRun && gid === gs[0]) for (let off = p.streak + 2; off < p.streak + 2 + p.bestRun; off++) tryG(off)
        const older = Array.from({ length: Math.max(0, p.joined - base + 1) }, (_, i) => base + i)
        for (let i = older.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1))
          ;[older[i], older[j]] = [older[j], older[i]]
        }
        for (const off of older) tryG(off)
      }
      continue
    }
    let count = check_ins.filter((c) => c.user_id === p.id).length
    const tryAdd = (gid: string, offset: number) => {
      if (count >= p.total || offset > p.joined) return
      if (generated(p.id, gid, offset)) count++
    }
    for (let off = 1; off <= p.streak; off++) gs.forEach((g) => tryAdd(g, off))
    let from = p.streak + 2 // leave a gap so the streak stops where it should
    if (p.bestRun) {
      for (let off = from; off < from + p.bestRun; off++) tryAdd(gs[0], off)
      from += p.bestRun + 1
    }
    const older = Array.from({ length: Math.max(0, p.joined - from + 1) }, (_, i) => from + i)
    for (let i = older.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[older[i], older[j]] = [older[j], older[i]]
    }
    for (const off of older) {
      if (count >= p.total) break
      tryAdd(pick(gs), off)
    }
  }

  for (const t of tags) t.usage_count = check_in_tags.filter((ct) => ct.tag_id === t.id).length

  return {
    profiles,
    groups,
    group_members,
    tags,
    check_ins,
    check_in_tags,
    reactions,
    join_requests: [{ id: 'jr1', group_id: 'g1', user_id: 'u7', status: 'pending', created_at: iso(new Date(nowMs - 3 * HOUR)) }],
    vouches: seedVouches(check_ins, group_members, iso(new Date(nowMs - 6 * HOUR))),
    cheers: [],
  }
}

/**
 * Vouches for everyone's Committed-and-up tiers, from up to three crewmates, so most rare cards start
 * verified. Two exceptions make the demo interesting: Ben's Committed in DIALED has one vouch (one to go)
 * and Dre has none yet (he reaches Committed live).
 */
function seedVouches(checkIns: CheckIn[], members: GroupMember[], at: string): Vouch[] {
  const out: Vouch[] = []
  const counts = new Map<string, number>()
  for (const c of checkIns) counts.set(`${c.user_id}|${c.group_id}`, (counts.get(`${c.user_id}|${c.group_id}`) ?? 0) + 1)
  for (const [key, n] of counts) {
    const [uid, gid] = key.split('|')
    const crew = members.filter((m) => m.group_id === gid && m.user_id !== uid && m.user_id !== ME_ID).map((m) => m.user_id)
    for (const t of TIERS.filter((x) => x.at >= 50 && n >= x.at)) {
      const take = uid === ME_ID && gid === 'g1' ? 1 : Math.min(3, crew.length)
      crew.slice(0, take).forEach((v) => out.push({ id: `v-${uid}-${gid}-${t.key}-${v}`, voucher_id: v, user_id: uid, group_id: gid, tier: t.key, created_at: at, deleted_at: null }))
    }
  }
  return out
}
