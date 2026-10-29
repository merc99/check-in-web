# Plan: mastery layer, first slice

The first buildable slice of `mastery-layer.md`. Branch `feat/mastery-1`, one commit per phase, a Vercel preview at
the end. Nothing merges to `master` until Ben approves.

**Decisions (Ben, Oct 28, 2026):** the crew is the skill; tiers stay 1 / 10 / 50 / 150 / 365 / 1,000; crewmates'
tier-ups show as milestone posts in the crew's feed; Strava is mocked in this slice.

## Goal
A visitor to the demo can see the mastery idea working end to end:
- each crew is a skill with a session count;
- check-ins can carry a few details (or stay loose);
- tiers have their own card materials;
- a tier-up shows up as a special card in the feed and in a trophy case on You;
- a fitness crew can pull in a (mocked) Strava run;
- one perk unlocks at a tier.

## What's there today
- `CheckIn` rows: note and tags only. `insertCheckIn` allows one per person per crew per day (good: that's a session).
- `getAchievements()`: six fixed achievements from totals (first, starter, 40, week, 50, perfect day).
- `AchievementCard` (foil), `RevealCard` (the unlock moment), `components/fx` (foil, holo sheen, aurora, burst).

## Phase 1: skills and sessions (data)
- **What a skill is (decided):** the **crew is the skill**. The crew's owner picks a *skill type* in crew
  settings (music, reading, fitness, art, writing, mind, other). The type decides which details a check-in offers.
- **Sessions:** one check-in = one session for that crew's skill. Counts per person per crew.
- **Tiers** (`lib/mastery.ts`): Started 1 · Habit 10 · Committed 50 · Seasoned 150 · Expert 365 · Master 1,000
 . A function gives the tier, the next tier and how many sessions to go.
- **Data:** `Group.skill_kind`; `CheckIn.details` (optional: minutes, items, book, pages, activity, distance) and
  `CheckIn.source` (`manual` | `strava`); new view models `SkillProgress` and a `milestone` kind of feed item.
  New functions in `lib/mock/api.ts`: `getMySkills()`, `getSkillProgress(userId)`; `insertCheckIn` records a
  milestone when a session crosses a tier.
- **Seed** so the demo shows several tiers at once: Ben at Committed in DIALED and Habit in Sketchbook Daily,
  crewmates spread from Started to Seasoned, one Expert in Explore.

## Phase 2: session details, specific or loose
- In the check-in sheet, a collapsed **Add details** row under the note. Loose stays the default.
- Fields by skill type:

  | Skill type | Fields |
  |---|---|
  | Music | Minutes; what you worked on (songs or exercises, as chips) |
  | Reading | Book; pages or chapters |
  | Fitness | Activity type; minutes; distance |
  | Art, writing, mind, other | Minutes |

- On the post card, details show as one or two quiet rows (an icon, the value), under the note.
- "Tidy with AI" (demo) also fills obvious details from a rough note ("20 min, Wonderwall intro").

## Phase 3: tier cards, the feed moment and the trophy case
- **`TierCard`** (`components/checkin/`): one component, a material per tier.
  - Paper with an ink stamp (Started).
  - Enamel in the skill's color (Habit).
  - Foil (Committed, reusing `Foil`).
  - Holo (Seasoned, the `SheenOnce` look, static at rest).
  - Holo with an aurora edge on hover only (Expert).
  - Master is shown locked in this slice: a silhouette with "1,000 sessions".
- **Your own tier-up:** the existing `RevealCard`, showing the tier card.
- **Feed:** a **milestone post** when anyone in the crew reaches a tier: the tier card, their name, the skill and the
  count. Rarer and more crafted than a normal post, still in one column. The live demo sometimes moves a crewmate up a tier so it can be seen.
- **Trophy case on You**, under "This week": one row per skill with its current tier card and "12 more sessions to
  Committed". The profile sheet shows a crewmate's top cards.
- Motion budget: tier materials join the effects table (calm, static at rest); the milestone post uses `SheenOnce`
  as it arrives; nothing new loops.

## Phase 4: Strava (mocked in the demo)
- Mocked in this slice. You → Settings → Connections: "Connect Strava" (demo) connects instantly.
- In a fitness crew's check-in sheet: **Add from Strava** lists three sample recent activities. Picking one fills
  activity, minutes and distance and marks the session `source: strava`.
- The post shows the activity rows and "From Strava" as plain text (no Strava logo, no implied partnership).
- A real integration later: OAuth, the activities API, a webhook. That needs a backend (the `supabase` branch).

## Phase 5: one perk
- **Foil profile frame**, unlocked at Committed in any skill: a thin foil ring on your avatar in the feed and on
  profiles. A toast when it unlocks ("New perk: a foil frame. Turn it on in Settings.") and a switch in Settings.
- A **Perks** line in the trophy case lists what's unlocked and what the next tier brings.

## Phase 6: check and ship the preview
- Kitchen sink: `TierCard` in every material, a milestone post, a details row, the Strava picker.
- Update `CLAUDE.md` (data, product components, effects table) and `.ux-profile.md` if the playful layer grows.
- `ux-audit` at 375 and 1280 in light and dark, keyboard and reduced motion on the new pieces, lint and build.
- Push `feat/mastery-1` for a Vercel preview; merge only on Ben's approval.

## Out of scope for this slice
Personal skills that span crews, verification and vouching, proof photos and clips, real Strava, partner perks,
shareable story images, numbered Master cards.

## Size
Roughly one long working session per phase for phases 1 and 3, shorter for 2, 4 and 5.
