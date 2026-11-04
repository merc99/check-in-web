# Plan: mastery layer, slice 2 ("10x")

Built on `feat/mastery-1`, on branch `feat/mastery-2`. Ben chose all four directions (Oct 28, 2026): unforgettable
moments, deeper progression, verified flex, collector profile. Demo only, like the rest of the app.

## Principles
- Rarity through craft, not ranking: nothing ranks people publicly; rarity is shown as "how many members get here".
- Obtainable first, rare later: lots of small achievements; the big tiers stay hard.
- One motion budget: each new effect gets its row in CLAUDE.md; nothing new loops; reduced motion everywhere.

## Phase A: data
- **Vouches** (`vouches` table): a crewmate confirms someone's tier (Committed and up). A tier with 2+ vouches is
  **verified**. Demo: crewmates vouch over time; you can vouch for theirs.
- **Proof** on a session: `CheckIn.proof` (`strava` | `photo`); the demo's photo proof is a picked image held in memory.
- **Skill achievements**: a catalog per skill kind, computed from sessions and details (first 20-minute session,
  5 songs, 50 km in a month, 10 books' worth of pages...).
- **Crew challenge**: one per crew per month, a session target for the whole crew, with progress.
- **Rarity**: the share of members across the demo who've reached each tier.
- **Binder**: a pinned card per person; Master cards get a serial number ("No. 0007").

## Phase B: the tier-up ceremony
Replaces the plain reveal for tier-ups, escalating by tier:
- **Started:** a stamp thunks onto paper.
- **Habit:** the enamel fills in.
- **Committed:** a foil flash across the card.
- **Seasoned:** a holo prism burst.
- **Expert:** the aurora edge turns once.
- **Master:** all of it, with the serial number.

Then "Share card" and "Keep going". Sound: the existing `levelUp`.

## Phase C: cheers and sharing
- **Cheer** on milestone posts: a big, springy hype button with a count and a short "cheered by" line, separate from
  emoji reactions.
- **Share card**: draws the tier card to an image (canvas, no new library) and offers the system share sheet or a
  download.

## Phase D: verified flex
- Milestone posts and tier cards show **Verified** with who vouched ("Maya, Priya and Sam").
- Crewmates' unverified milestone posts offer **Vouch**. Your own show "2 more vouches to verify".
- "Add proof" in the check-in sheet: a photo (demo, kept in memory) or Strava. Posts show the proof.

## Phase E: collector binder
- **Binder** on You and on profiles: every tier card earned, across skills, plus locked slots for what's next.
- **Pinned card**: pick one to show first (and on your profile sheet).
- **Flip**: tap a card to see its history (first session, the tier's session, best month, vouches).
- **Rarity line**: "Reached by 18% of members".
- **Master cards** are numbered, shown locked with the number they'd get.

## Phase F: achievements and challenges
- **Per-skill achievements** in the trophy case: a count ("14 of 40") and a grid of small badges, obtainable ones first.
- **Monthly crew challenge** card on the feed banner's details panel and on You: "October: 120 sessions together, 64%".

## Phase G: check and ship
Kitchen sink, docs (CLAUDE.md effects and mastery sections), ux-audit at 375 and 1280 in both themes, keyboard and
reduced motion, lint and build, push for a preview. Merge only on Ben's approval.
