# Idea: the mastery layer

Ben's notes (Oct 28, 2026, updated the same day), with first thoughts on how they could work in Check-in. Not built yet.

## The idea, in Ben's words

Check-in as a **social accountability layer for skilling up**. People log check-ins for anything they're getting
better at: guitar practice, reading chapters, working out. The "10,000 hours to mastery" idea is the frame.

Each person earns **unique, verified badges, achievements and cards** that show up on the feed, so they can *flex*
what they've put in. Skilling up in life and becoming the best version of yourself, through any interest.

The designs should be so well made and curated that **hard achievements are notable and obvious** to everyone who
sees them, and seeing them makes people want to put in the work too.

**Added later the same day:**
- **Strava integration**, so workouts flow into check-ins easily.
- But the main measure should be **how many times someone has checked in to a specific thing**, not hours. For
  example, "guitar practice": someone logs that they practised, and can add specifics of what they did on the card,
  or keep it loose.
- Achievements should be **obtainable**, and there should be a way to earn **cool perks**.

## Why it fits Check-in

- It's the natural next step from "did you show up today?" to "look how far showing up has taken you."
- The all-time count is already sacred in the brand. Sessions per skill are the same idea, made visible.
- The effect system already has the right materials (foil, holo, enamel medals, the reveal card), so rarity can be
  shown through craft rather than numbers.

## How it could work (first pass)

### 1. Count sessions per skill (the main measure)
- Each **skill** is something a person checks in to: guitar practice, reading, lifting. The core number is
  **sessions**: how many times they've shown up for it. Simple, honest and hard to fake in bulk (one per day per skill).
- A skill can be practised in more than one crew; the count adds up across them.
- **Time is optional** ("45 min"), for people who like it, never required. 10,000 hours stays a framing for the top
  tier, not the scoreboard.

### 2. Session details: specific or loose
- A check-in can stay loose ("practised") or carry **specifics** shaped by the skill:
  - **Guitar:** songs, scales, minutes, a short clip.
  - **Reading:** book, chapters or pages.
  - **Workout:** type, distance or sets (or pulled from Strava, below).
- Specifics show on the post card as small, clean rows, so a detailed session looks richer without the loose ones
  looking lesser.
- The existing "Tidy with AI" helper could suggest these fields from a rough note ("learned the intro to Wonderwall,
  20 min" → song + minutes).

### 3. Strava, for the workout crowd
- Connect Strava once, then pick a recent activity when checking in (or have runs and rides suggested as check-ins,
  never posted without a tap).
- The card shows the activity's essentials (type, distance, time, maybe a small route shape) in Check-in's own design.
- Strava is the first integration; the same "bring your proof in" pattern could later cover Apple Health, Goodreads,
  a practice-app export and others.
- Portfolio demo: a mocked Strava connection with sample activities, the same way the rest of the demo works.

### 4. A mastery path per skill, by sessions
- **Tiers** along the way, each with its own material, so a glance tells you how far someone has come. Early tiers
  come quickly (obtainable), later ones take real commitment.

  | Tier | Sessions | Material (idea) |
  |---|---|---|
  | Started | 1 | Paper card, ink stamp |
  | Habit | 10 | Enamel pin in the skill's color |
  | Committed | 50 | Foil card, tilts with the pointer |
  | Seasoned | 150 | Holo card, the sheen |
  | Expert | 365 | Holo + a turning aurora edge (a year of sessions) |
  | Master | 1,000 | A one-of-a-kind card, numbered, never repeated |

- Alongside the tiers, smaller **achievements** that anyone can earn early: first week, a month without two missed days
  in a row, first detailed session, first vouch, first Strava run. Obtainable is the point; the tiers carry the rarity.

### 5. Verified, so it means something
"Verified" is what makes a flex worth noticing. Options, from lightest to strongest:
- **Consistency-verified:** earned only from real check-ins over real days (no back-filling a year in a day).
- **Crew-vouched:** crewmates confirm big milestones ("Maya vouched for this"). Social, and fits the crew-first idea.
- **Proof check-ins:** a Strava activity, a photo, a recording or a link on milestone sessions.

### 6. Cards that travel
- Reaching a tier drops a **milestone card into the feed**: a distinct post type, rarer and more crafted than a
  normal check-in, so it stops the scroll.
- A **trophy case** on the You tab and on each person's profile: the cards they've earned, by skill.
- Shareable outside the app (an image for stories), the portfolio-friendly version of the flex.

### 7. Perks: what showing up unlocks
Perks reward the work and keep it fun. Ideas, roughly in order of how soon they could exist:
- **Looks:** card finishes, profile frames, banner effects for crews you lead, extra reaction emoji, app themes.
- **Status that helps others:** being able to vouch for others after your own Committed tier; mentor tags in crews
  for your skill; starting a public crew in Explore.
- **Early access:** new features first for long-standing members.
- **Real-world perks (later, with partners):** discounts on gear, lessons or books for a skill (a guitar shop, a
  running brand). Needs care: perks must never feel like the reason to show up, and never pressure anyone.

## Tensions to decide early

- **Flex vs "no shame days".** Flexing can turn into comparison. Proposal: celebrate the *work put in*, never rank
  people against each other in public, and keep beginner tiers just as well designed as the rare ones.
- **Gaming the count.** One session per skill per day, plus verification on the big tiers, keeps rare cards
  meaningful. Strava and proof check-ins make the high tiers harder to fake.
- **Rarity has to stay rare.** If everyone has a holo card, nobody notices. The tier thresholds and materials need a
  deliberate curve.
- **10,000 hours is a frame, not a promise.** Copy should be warm about it ("every session counts"), not a countdown.
- **Perks vs motivation.** Rewards can crowd out the reason people started. Keep perks mostly cosmetic and social,
  and keep the brand voice: showing up is the point, perks are a thank-you.

## Possible first slice to build

1. Skills and a session count per skill in the data layer (one per day), with optional minutes.
2. Optional session details on check-ins for two skills (guitar and reading), shown as rows on the post card.
3. The tier ladder and three card materials (paper, enamel, foil), reusing `components/fx`, plus a milestone post
   type in the feed and a trophy case on You.
4. A mocked Strava connection in the demo: pick a sample run when checking in.
5. One perk to prove the idea: a card finish unlocked at the Committed tier.

## Open questions

- Is a "skill" the crew, or something a person names themselves (and can link to several crews)?
- Which session details should each kind of skill offer, and who defines them (us, or the crew)?
- Does Strava become a check-in automatically, or always need a tap? (Proposal: always a tap.)
- Which perks are worth building first, and are real-world partner perks in scope at all?
- Which tiers need verification, and who can vouch?
- Should Master cards be truly unique (numbered, generated art) or a shared design with the person's details?
- Does the feed show milestone cards from every crew you're in, or only the crew on screen?
