# Check-in (web): project guide for Claude Code

Social habit tracker for small crews (3–15 people). Brand line: **"No shame days, just show up."**
An accountability app, not a productivity app. The crew is the emotional core, not the individual streak.

This is a **portfolio build**: it runs entirely on built-in demo data, deployed on Vercel. There is no backend
on `master` (see *Data*).

`prototype/check-in-prototype.html` is the reference for **structure, flows and interactions**. Its *visual style*
(peach, ink borders, offset shadows, Bowlby One) is **retired**; the system below replaces it.
When this file and the prototype disagree, this file wins.

## Stack
- Next.js (latest stable, App Router), React 19, TypeScript, `@/*` alias
- Tailwind CSS v4, configured CSS-first in `app/globals.css` (there is no `tailwind.config.ts`)
- shadcn/ui CLI (`components.json`), `tw-animate-css`, `clsx` + `tailwind-merge` (`cn` in `lib/utils.ts`)
- `next-themes` (light / dark / system), `lucide-react` icons, fonts via `next/font/google` (Geist, Geist Mono) and `next/font/local` (Satoshi Black, the wordmark only)
- Data: an in-memory demo (`lib/mock/`), shaped like the Supabase schema. No backend on `master`.

## Skills and references (read these)
- **`.ux-profile.md`:** taste, accessibility, bans, voice, icons, and the *playful layer* (the only places the hard
  rules relax). Read it before any UI work.
- **`.claude/skills/ui-references/`:** Ben's catalog of reference sites and the Check-in component map. **Before building
  or restyling any component, look it up there** and follow its order: reuse ours, then MCP, then registry, then
  copy-paste, then build. When Ben shares a new site, follow its `intake.md`.
- **UI/UX skills** in `.claude/skills/` (page-patterns, viewports, forms, surfaces, loaders, empty-states, ux-copy,
  motion, colour-palette, typography). Name a `page-patterns` pattern before writing a new page. Layouts must pass
  `viewports` at 375px and 1280px. Before finishing UI work, run `ux-audit`, then `design-critique` on a screenshot.
- **Library skills** (Arc, transitions.dev, Tailgrids, ReUI if installed) are for *finding, installing and wiring*
  components. **Precedence:** this file > `.ux-profile.md` > `ui-references` > any library's own design rules.

## Where components live
- `components/ui/`: shadcn primitives (button, card, avatar, sheet, dialog, tabs, sonner, input-otp...), **restyled to
  the specs below**. Registry components depend on these, so keep shadcn's file names and variant names.
  Nothing else goes in this folder.
- `components/arc/`: Arc installs (motion components). Restyle via tokens, not by forking unless needed.
- `components/bencho/`: Bencho components (MIT, bencho.dev/licence), their CSS in `app/bencho.css` (imported by
  globals.css), Bencho tokens mapped to ours. On screens: `LiquidToggle` (inside `Switch`), `RollingCounter` (New crew,
  max size), `StackedBars` (You, "Your days" via
  `components/you/CrewDays.tsx`), `CreateMenu variant="rail"` (the desktop rail's +), `Assignees inline` ("With" in
  the check-in sheet). `MagneticSelect` (crew covers as a cluster) and the rest live on the kitchen sink's
  Bencho shelf only. Keep their comments; lint exceptions sit at the top of each file with a reason.
- `components/checkin/`: Check-in product components (`TagChip`, `ToggleChip`, `CrewAvatar`, `ThemeToggle`, and the
  ones listed under *Product components*). Build once, reuse, never restyle inline.
  It also holds the pre-upgrade components (PascalCase files, e.g. `Button.tsx`, `Sheet.tsx`). Screens move to the
  shadcn primitives and the new product components one at a time; delete an old file once nothing imports it.
- Screen-specific pieces live next to their screen's folder (`components/feed/`, `components/explore/`, ...).
- `/kitchen-sink` shows every `components/ui` and `components/checkin` piece in every state. Add new pieces there too.
- Any file adapted from a catalog site starts with `// Pattern: <site> / <component> (adapted to Check-in tokens)`.

## Visual system: calm and exact, light + dark
Clean UI pass (Nov 2026, `docs/ideas/clean-ui-direction.md`, Ben's references + the unslop skill): flat graphite
surfaces, hairlines and a lit top edge, pills, one bright button per screen, mint only where it means showing up,
big medium-weight numbers with small muted units, mono for small figures. Color lives in content (avatars, photos,
tier cards, chart marks, dots); the glossy and holographic effects are kept for real moments only.

Every value is a CSS variable in `app/globals.css` (`:root` = light, `.dark` = dark). Names follow **shadcn's standard**,
plus a few Check-in extras, so registry components inherit the theme.

- **Never** write hex, `rgb()`, or Tailwind palette colors in components. The theme removes the default palette
  (`--color-*: initial`), so `bg-zinc-100` renders nothing. Imported components: grep for palette classes and map them.
- **Never** build class names at runtime (`bg-${hue}`). Use `HUE_CLASS` from `lib/colors.ts`.
- **Surfaces:** graphite ramp in both modes. `bg-sidebar` (desktop crew rail) → `bg-background` (canvas) → `bg-card`
  (cards, lists, L1) → `bg-muted` (inputs, tracks, active pills, L2) → overlays `bg-popover` + `shadow-overlay`.
  Lists are L1 surfaces with hairline dividers. Depth in dark mode is the surface step plus `edge-lit` (a lit top
  edge), not drop shadows. `hatch` marks "not yet" (future days, unfilled segments).
- **Text:** `text-foreground`, `text-muted-foreground`, `text-subtle-foreground`; `text-on-color` on solid crew hues.
- **Lines:** `border` (default color is `--border`) everywhere; `border-border-strong` for secondary buttons and hover;
  `border-input` for input edges (3:1 against the card, WCAG 1.4.11).
- **Brand accent = `primary` (mint)**, a few percent of a screen: the check-in action (`variant="brand"`), "in" states
  (the tally, check badges), your own chart line or bar, `text-primary-ink` for links and mint text, `bg-primary-soft`
  for a delta pill, `ring` for focus. The default primary button is off-white on dark, near-black on light.
  Selected options (tags, detail chips) use the neutral selected chip (`bg-foreground text-background`), not mint.
  Note: shadcn's `accent` token is a neutral hover fill, not the brand color.
- **Destructive:** `bg-destructive-soft text-destructive-ink` (soft) or `bg-destructive text-white` (solid, rare).
- **Crew hues** (coral, sky, rose, grape, lemon, leaf, clay, indigo): content color only. Solid `bg-{hue}` for
  avatars, dots, chart marks and small badges; `bg-{hue}-soft text-{hue}-ink` for the crew medal (`CrewBlock`) and
  a cover without a photo. Tinted cards (`CrewTint`, Ben, Nov 2026): the feed header and its copies in the crew switcher
  wear the crew's hue; milestone posts wear the tier's hue; your card on You wears your own color. Otherwise never a banner, panel, post edge or page wash. Tags are neutral chips with a hue dot.
  Mint is not a crew or avatar hue (it's `primary`); demo data that used mint now uses leaf.
- **Shadows:** resting cards have none in dark (`edge-lit` only) and a 1px soft one in light. `shadow-raised` for
  floating things (FAB, dock), `shadow-overlay` (sheets, menus), `shadow-you` (the signed-in user's avatar ring).
- **Radii:** `rounded-md` 10 (inputs, small controls), `rounded-lg` 16 (small cards), `rounded-xl` 20 (cards, posts,
  sheets), `rounded-full` (buttons, tabs, chips, avatars). Nested radius = outer minus padding.
- **Type:** Geist for everything, weights 400 and 500 (600 rarely; `font-bold`/`extrabold` are capped at 600 in the
  theme). Hierarchy from size and color. `font-display` is now Geist medium (kept as a name for titles and big
  numbers). `font-mono` (Geist Mono) for small figures, meta, counts and chart axes. Big numbers: medium, `tnum`,
  `tracking-tightest` from 40px, with a small muted unit ("2/5", "14 days"). No uppercase tracked labels.
- **Logo:** `BrandMark` / `LogoMark` (components/checkin/BrandMark.tsx): the red → yellow → green gauge with a check, and
  the wordmark "check-in" in Satoshi Black (`font-wordmark`, `app/fonts/`), lowercase. Only the wordmark uses it. `size="lg"` adds "stay consistent with
  people." (the signed-out welcome screen at `/`). Don't redraw it elsewhere.
- **Layout:** phones get one centered column, `max-w-app` (640px), with the bottom tab bar: Explore · Feed · You.
  Desktop (`lg`, 1024px+) gets `AppSidebar` (tabs + your crews) instead of the tab bar and FAB, in a shell up to
  1600px. Pages stay one centered column unless their `<main>` sets `data-layout="wide"`: the feed (one column of posts,
  up to 760px, + a sticky right rail with check-in, `CrewHero` and your week), Explore (the ring at full size,
  crews in two columns) and You (your card and the mosaic side by side, then two columns: week, your skills, crew recap, achievements, recent | leaderboard, crews). Sheets open as centered dialogs on desktop (`ResponsiveSheet`).
  Use `lg:` classes where CSS can do it, `useDesktop()` (`lib/viewport.ts`) only where JS must choose.
- **Modes:** both first-class; **dark by default** (`defaultTheme="dark"`); You → Settings switches to light or system. Check every screen in both.

### shadcn primitive specs (apply after `shadcn add`)
- **button:** `rounded-full font-medium`, sizes `sm` h-9 px-4 text-[13px], `default` h-12 px-6, `lg` h-14 px-8,
  `icon` size-11. Variants: `default` = `bg-foreground text-background edge-lit` (the one bright button);
  `brand` = mint, the check-in only; `secondary` = `bg-muted border edge-lit`; `outline` = transparent with
  `border-border-strong`; `ghost` = `text-muted-foreground
  hover:text-foreground hover:bg-muted`; `destructive` = `bg-destructive-soft text-destructive-ink`; `link` =
  `text-primary-ink underline-offset-4`. Press: `active:scale-[.97]`, 150ms ease-out.
- **card:** `rounded-lg border bg-card edge-lit` (`rounded-xl` for posts and stat cards); padding 16 (20 for large);
  interactive cards brighten their edge on hover (`hover:border-border-strong`) and press down; no lift.
- **input / textarea:** `h-12 rounded-md border-input bg-card`, focus = 3px `ring-ring/25` + `border-ring`. `--ring` is the
  deep mint (`#047857`) in light mode and mint in dark, so focus is at least 3:1 in both.
- **sheet:** bottom side, `rounded-t-xl shadow-overlay`, drag handle, scrim `bg-black/40`. Prefer Arc `bottom-sheet`
  if it gives drag-to-dismiss with velocity.
- **toasts:** `components/checkin/Toast.tsx` (not sonner): a frosted stack with a mint edge, batching arrivals.

## Motion
- **Chrome** (buttons, sheets, tabs, toasts, lists, page transitions): 150–200ms, `ease-out` on enter, `ease-in` on
  exit, transform and opacity only. Entrances `animate-rise`. Press `active:scale-[.97]`.
- **Delight moments** (springs allowed, `ease-spring` / `--fx-spring`): check-in stamp, avatar check-badge pop, heart
  burst, chip selection, rolling digits, emoji reactions (picker rise, the flying landing and squash, each emoji's
  own arrival), and the 👋 on a crewmate you waved at. The list is closed.
- **Effects** are the `components/fx` system (below). Use one of them before writing a new effect.
- transitions.dev recipes are the default source for chrome motion; keep our durations and easing when adopting them.
- Always respect `prefers-reduced-motion` (globals.css zeroes animations; every fx piece has a reduced-motion branch).

## Effects (`components/fx`) and the motion budget
One system, picked by Ben on `/fx-preview` (Oct 2026) from the app, `premium-ui-kit/` and `mmo-fx-kit/`. CSS knobs
are the `--fx-*` tokens in `app/globals.css`; JS timings are `components/fx/config.ts`. Check `/fx-preview` after
changing any of them, in light and dark, on a phone and desktop.

**Budget.** Everyday screens stay calm: an effect answers a touch, then rests. Bold effects are for real moments only.
One loop remains, scoped to one place: the invite ticket's sheen. Nothing else idles. Never add a second effect to a surface that has one.
Retired in the clean UI pass (kept in `components/fx` and `/fx-preview` for reference, not used on screens):
`AuroraFrame`, `HoloBanner`, `Gloss` / `GlossPill` / `GlassInset` panels, `SheenOnce` on posts, `crew-glow`, `CrewSurface` banners.

| Effect | Tier | Allowed only on |
|---|---|---|
| `Foil` + `FoilLight` (white sheen; one sweep on tap; no hover tilt or shine since Nov 2026) | calm | Unlocked `AchievementCard`s, and inside the milestone reveal |
| `SheenLoop` (a soft rose → white → sky band crosses, then rests; 7s cycle; under the content) | scoped loop | Invite `Ticket`s (crew settings, the invite page) |
| `burstFrom` (canvas particles, crew hue + mint) | moment | After a check-in, from the button used (FAB or rail button) |
| `flyArc` + `squash` (arc, tilt, land) | moment / calm | The day's first check-in (+1 to the streak: rail on desktop, You tab on phones); reactions landing on their chip |
| `RevealCard` (shake, beam, hue flood, burst) | moment | When a check-in unlocks an achievement. Nowhere else |
| `RollingCount` (odometer digits) | calm | Every number that changes: stats, the crew hero, streaks, reaction counts |
| `HoldButton` (hold to confirm, no sheet) | calm | Destructive actions only: delete a crew or your account, leave a crew, remove a member |
| Toast stack (frosted, batched) | calm | Confirmations and live news; up to three, 4.2s, tap to dismiss |
| Frosted glass (`--fx-glass` + blur, opaque fallback) | calm | The tab dock and toasts |
| `Sparkline` (draws in once, left to right) | calm | The crew's last 14 days, your last 12 weeks (in mint) |
| Arrival burst (`burstFrom`, small) | live activity | A crewmate's sticker in the hero when they check in |
| Whole-crew burst (`burstFrom`, once) + "all in" pop | moment | Phones: the TodayStrip, when the last member checks in while you watch (not on load or a crew switch) |
| `animate-handwave` (👋 pops and wiggles) | delight | A crewmate's sticker after you wave at them |
| Header swipe (follows the finger, slides out/in 150/200ms) | calm | Phones: the feed's crew header, to move between your crews |
| `LogoMark` shimmer (one sweep) | calm | The logo: once when it appears, and on hover. Never loops |
| Sparkline scrub (guide, dot, label) | calm | Every `Sparkline`: hover, drag or arrow keys show one point; no resting dot |
| Tier card materials (paper, enamel, `Foil`, holo film, a still aurora edge; nothing moves on hover) | calm (static) | `TierCard`: milestone posts, the trophy case, profiles, the kitchen sink |
| Foil frame (static holo ring) | calm (static) | Your avatar, when the perk is on |
| `TierCeremony` (rise, flip, a finish by tier, burst) | moment | Your own tier-up only (and the kitchen sink) |
| Binder flip (500ms, ease-out) | calm | Binder cards, on a tap |
| Hover edge / press | calm | Post cards, Explore crew cards, leaderboard rows, crew share rows (no lift) |
| `CrewTint` glow (soft hue halo, brighter edge; still holo edge from Seasoned) | calm (static) | Milestone posts only |
| `LiquidToggle` (droplet stretches as it crosses) | calm | Every `Switch` |
| `RollingCounter` (digits roll, drag or step) | calm | New crew, max size |
| `CreateMenu` (pill unfolds into a menu, no overshoot) | calm | The desktop crew rail's + (start, join with a code, browse) |
| `Assignees` (faces drop into the pill, list unfolds) | calm | "With" in the check-in sheet |
| `StackedBars` (grow in once, scrub ring + tooltip) | calm | You, "Your days" by crew |
| `TaskRun` (turning wedge on the active step, sub-lines fold) | live state | The crew recap while it writes, and Tidy with AI; the wedge stops when the step ends |

**Sound** (`components/fx/sound.ts`): off by default; You → Settings → Sounds. `success` after a check-in, `tap` when
picking a reaction, `charge` / `confirm` on hold buttons, `levelUp` on a milestone reveal. No other sounds.
**Not used** (judged on `/fx-preview` and the live demo): white pointer lights and glows on colored surfaces,
dark press shading on cards, metallic text and metal buttons, rarity tiles, parallax art, liquid glass
refraction, light rings as default borders, the full-screen joy takeover.

## Product components (`components/checkin/`)
Build these with the primitives and the sources in `ui-references/check-in-map.md`:
- **GlassTabBar:** `bg-card/75 backdrop-blur-xl border shadow-raised rounded-full`, opaque fallback via
  `@supports not (backdrop-filter: blur(1px))`; active tab = a raised `bg-muted edge-lit` pill sliding (200ms).
- **Crew look** (`lib/crewStyle.ts`): each crew has a color, an `emoji` (on its `CrewBlock`, else the first letter)
  and a cover `pattern` (`CrewCover`: dots, stripes, waves, grid, confetti, plain). Owners pick all three in crew
  settings (`components/crew/CrewLook.tsx`). Explore cards without a photo wear the cover as a soft tint, so no two crews look alike.
- **TodayStrip** (phones): who's in today as a plain card under the crew header, one row of stickers + "n/total";
  tapping it opens the brand line, the 14-day line, the challenge and the tally. `CrewHero` shows only in the desktop rail.
- **The tally (signature):** one pill per member or day, mint when in, muted when open, hatched when still to come.
  Who's in today (TodayStrip, CrewHero) and your week (`HeatmapGrid`). Nowhere else.
- **CrewHero** (desktop rail): a plain `rounded-xl` card: "In today", big "n/total" in `RollingCount` ("all in" in
  mint when everyone is), the brand-voice line, the last 14 days as a mint line, the stickers, the tally.
- **PostCard:** a plain `rounded-xl` card (Rivals); avatar (yours has the mint ring), name + relative time, note, neutral `TagChip`s with a hue dot, `Reactions` (emoji
  chips from `lib/reactions.ts`, ❤️ first; yours are mint; the smiley opens the picker); own card gets a quiet mint
  "Just in" dot for an hour; double-tap = heart burst and adds your ❤️.
- **AchievementCard:** unlocked ones are foil: filled with the achievement's hue, `text-on-color`, a dark enamel medal,
  white sheen (a tap sweeps it; still under a mouse). Locked ones stay dashed.
- **HeatmapGrid:** the week as the tally: 7 tall pills Mon–Sun, the mono day letter above and the date below (today's
  in full ink); done = `bg-primary` + check, and back-to-back days in are joined by a mint bridge (the streak you can
  see); open = a quiet `bg-muted` well; future = faint `hatch`; today = a ring (a dot while still open);
  `animate-cellin` staggered when the You tab opens. The feed rail's card: "n/7 days", then streak | all time under a hairline.
- **LivePill**, **Ticket** (`Ticket.module.css`, Ben, Nov 2026): the crew's hue with depth, two notches cut clean
  through at the perforation (a mask; the shadow is a drop-shadow filter so it follows the cut), the code as letters
  pressed into the ticket (dark wells, inner shadow, a lit lip, bright letters), `animate-wave` on copy, and the
  `SheenLoop` gliding under the content, never over the code.
- **Switch**: renders Bencho's `LiquidToggle`; same API (`checked`, `onChange`, `label`, `disabled`).
- **TaskRun** (`components/checkin/TaskRun.tsx`, after magpui's agent task list): a list driven by typed events
  (`useTaskRun().emit`): one active step with a turning lemon ring and a timer, sub-lines that fold when it ends, a mint
  check and rail when done, and a `gate` step that says "Asks first" in plain muted mono text (or shows the `gate` node) and waits for the person.
  aria-live announces each step; reduced motion stills it.
- **CrewSurface** (`components/checkin/CrewSurface.tsx`): a crew's own surface, its hue with depth (deeper toward the
  bottom, a lighter tone of the same hue top right), film grain and a lit top edge; overlays on it are dark ink
  (`bg-black/10`), never white. `CrewMedal` is the crew's emoji as a dark enamel badge. Retired from everyday
  screens in the clean UI pass (the feed header, Explore covers and crew-look preview are neutral now); kept for
  the kitchen sink and as a reference.
- **FeedHeader:** the crew you're in as its own card (Ben, Nov 2026: make the crew obvious, crews look different):
  a `CrewTint` in the crew's hue, its cover pattern faint on the right (`CrewCover`), its emoji on a solid hue tile,
  the name (medium, 22/28px, wraps to two lines, tap to switch), one muted line of members and crew streak, the
  round gear, the crew's pinned note on a dark ink strip inside the card, then the TodayStrip on phones.
- **Join requests** (`components/feed/JoinRequests.tsx`, owners only): a dashed row in the "In today" card
  (TodayStrip on phones, CrewHero on desktop): faces + "Jordan wants to join" + Review, which opens a `ui/popover`
  list to accept or decline in place. Gone with the last request.
- **Crew switcher** (`CrewSwitcherSheet`): each crew is a small copy of its header card (`CrewTint`, cover, emoji
  tile, "n of total in today"); the one you're in has an outline in its hue and a "You're here" pill, the rest say "Open". Scrolled, it collapses into a neutral frosted sticky bar with the crew's dot.
- **CrewTint** (`components/checkin/CrewTint.tsx`): a crew's hue lit into a card: one soft light from the top in a
  brighter tone of the hue, fading into the neutral card (no diagonal blobs, so clay never turns brown), a quiet hue
  hairline and a lit top edge; text stays light (dark) or dark (light). `glow` moves the light to the medal (top left),
  brighter and closer, with a soft halo under the card; `holo` a still holo edge. Only on
  the feed header and the crew switcher (plain), milestone posts (glow; holo from Seasoned up) and `YouHero` (glow).
- **AppSidebar** (desktop): a 72px crew rail (medals, a bar on the active one, + to start or join) on `bg-sidebar`,
  then a quiet panel: the logo, the three tabs as pills, the current crew's card at the bottom.
- **You** (revamp, Nov 2026): `YouHero` (`components/you/YouHero.tsx`), your own card as a `CrewTint` glow in your
  color with faint dots: avatar, name, handle, your top tier as a small `TierMedal`, bio, an edit pencil, and an ink
  strip of all time (biggest) | streak | best in `RollingCount`. Then `ShowingUp`: the last 20 weeks as a mosaic (mint
  in, muted open, hatched still to come, today ringed), "n of m days in", this month | last month. Side by side on
  desktop. Then the week tally, skills (`TrophyCase`: compact rows, a tier disc, a bar in the next tier's hue), binder,
  recap, achievements, recent | the leaderboard and the crew share.
- **Check-in** (feed): stamp in the sheet → burst from the button + `success` → your post drops in → on the day's
  first check-in, +1 flies to the streak → a `RevealCard` if it unlocked an achievement, otherwise one toast.
- Feed background: plain `bg-background` (the old `crew-glow` wash is retired; the class is a no-op).
- **MemberSticker:** a crewmate in "who's in today" (CrewHero, TodayStrip). In: their color + mint check. Not in yet:
  faded and dashed; a tap **waves** at them (`waveAt`, once per person per crew per day, toast "You waved at Sam. No
  pressure."), then a 👋 sits on their sticker. The demo answers about two waves in three with a check-in.
- **Reactions:** hold a chip (touch), right-click it, rest the mouse on it or press the menu key to see who left it
  (a small popover). The hold never also toggles the reaction.
- **Banner swipe** (phones): swipe the feed banner sideways to move to your next or previous crew; dots in the facts
  line show which crew you're on.
- **Behavior to keep** from the current build when these are rebuilt: sheets close on Escape, on a drag past ~110px or a
  fast flick, and trap focus; toasts batch, stack up to three and hide after ~4.2s (hover pauses); tapping the LivePill
  scrolls the feed to the top (or switches crew for an arrival elsewhere); a tap on a `HoldButton` explains the hold.

## Screens (routes)
`/` welcome (signed out only) · `/feed` · `/explore` · `/you` · `/group-settings/[groupId]` · `/new-group` · `/profile/edit` ·
`/manage-tags/[groupId]` · `/invite/[slug]` · `/kitchen-sink` (component reference).

## The demo (how the portfolio build behaves)
- **No accounts, no intro.** The app opens signed in as Ben (`lib/auth.tsx`); `/` sends you to the feed. Sign out
  shows the welcome screen at `/` (logo lockup + "Sign back in"). "Get started to join" on an invite page
  remembers the invite and lands back on it.
- **Fresh state on every page load.** The demo re-seeds from `lib/mock/seed.ts` (relative to "now", so the feed
  always looks like today); nothing persists. Only the chosen crew is remembered, in `localStorage`.
- **Live crew activity.** `lib/mock/simulation.ts` checks a crewmate in every 9–16s (mostly in the crew on screen) and
  hearts your post ~2.6s after you check in. On by default, including production; `NEXT_PUBLIC_SIMULATE_LIVE=false`
  turns it off. Screens react through the same change events a real backend would send.
- Demo-only shortcut: an invite code that matches no crew joins the first open public crew.

## Mastery (`lib/mastery.ts`)
The skilling layer (ideas and the first-slice plan in `docs/ideas/`). **The crew is the skill**; every check-in is a
**session**.
- **Skill kind** per crew (`Group.skill_kind`: fitness, music, reading, art, writing, mind, health, other), picked by
  the owner. It decides the check-in's detail fields (`DETAIL_FIELDS`).
- **Tiers** by sessions: Started 1, Habit 10, Committed 50, Seasoned 150, Expert 365, Master 1,000. `tierFor`,
  `nextTier`, `tierReachedAt`. Data: `getMySkills()`, `getSkillsOf(userId)`; a `FeedItem.milestone` marks the
  session that reached a tier.
- **Session details** (`CheckIn.details`, optional): only from a picked Strava activity now. The details form is gone
  (Ben, Nov 2026: a check-in is a quick thing, so no clicking through fields). The sheet is the note, "Add photo",
  "Add from Strava" (fitness crews), tags (pick or make one) and "With". Posts show details as quiet icon rows
  (`SessionDetails`); seeded posts still carry some.
- **TierCard** (`components/checkin/TierCard.tsx`): a material per tier (paper, enamel, foil, holo, holo + an aurora
  edge; Master shows locked). No hover tilt or shine (Ben, Nov 2026); a tap still sweeps the sheen on touch.
- **Milestone posts:** a crewmate's (or your) tier-up turns the whole post into a `CrewTint` card in the **tier's**
  color (`TIER_HUE`: Started leaf, Habit sky, Committed clay, Seasoned indigo, Expert grape, Master lemon) with a
  lighter glow wash (a still holo edge from Seasoned up), with one compact line: the `TierMedal`, "Maya reached Seasoned" and "150 sessions in
  DIALED"; then the reactions (and Share card on yours). `TierMedal` is a flat 44px disc
  (`TierBadge.module.css`) in the tier's own palette with a white icon: green sprout, sky calendar, fire flame (lemon →
  clay → coral), dusk mountain, prism gem, gold crown; a smooth gradient, a hairline lit edge and a soft glow, a still
  holo ring from Seasoned. No numbers, no orb or gloss (Ben, Nov 2026). The live line says "Dre reached Committed". Your own tier-up opens the `RevealCard`. **Trophy case** ("Your skills") on You under "This
  week", with sessions to the next tier and a Perks list; a crewmate's cards on their profile sheet.
- **Strava (mocked):** `CheckIn.source` (`manual` | `strava`). You → Settings → Strava, or "Connect Strava" in the
  sheet, turns on the demo (sample activities, `getStravaActivities`). Fitness crews get "Add from Strava"; posts say
  "From Strava" in plain text (no logo, no implied partnership). A real integration needs a backend.
- **Perk:** the foil frame (`foil-frame` utility) on your avatar, unlocked at Committed, switched in Settings
  (`lib/prefs.ts`, remembered in this browser). More perks: see the ideas doc.
- **Demo seed:** Ben at Committed in DIALED (61) and one session from Habit in Sketchbook Daily (9); Dre one from
  Committed (49), so his next check-in is a milestone post; Maya at Seasoned (152).

### Mastery, slice 2 (`docs/ideas/mastery-slice-2-plan.md`)
- **Ceremony** (`components/fx/TierCeremony.tsx`): your own tier-up opens a face-down card; a tap flips it and the
  finish grows with the tier (paper stamp, enamel fill, foil flash, holo prism, aurora turn, all of it for Master),
  then rarity, Share card and Keep going. Every tier plays from the kitchen sink.
- **Cheers:** retired from screens (Ben, Nov 2026: redundant with reactions). The `cheers` table and `cheer()` stay in
  the data layer; the demo crew now celebrates milestone posts with 🙌 👏 🔥 reactions.
- **Vouches:** retired from screens (Ben, Nov 2026: it added nothing). The `vouches` table and `vouch()` stay in the
  data layer; nothing shows "Verified" and the demo crew no longer vouches.
- **With:** a check-in can name crewmates who did the session with you (`CheckIn.with_user_ids`, `FeedItem.with`;
  same crew only, never yourself, up to six). Picked in the sheet ("Just me" when empty); posts read "You with Maya".
  The demo crew sometimes tags a crewmate who's already in.
- **Proof:** "Add photo" in the check-in sheet (demo: an object URL, kept on this device); it shows on the post.
- **Share card** (`lib/shareCard.ts`): a 1080×1350 image drawn on a canvas (share sheet or download); the rarity
  line only when 40% or fewer members reach the tier.
- **Binder** (`components/checkin/Binder.tsx`): every tier card earned as portrait trading cards; tap to flip for
  its history; pin one to the front (`Profile.pinned_group_id`); share; next tiers as locked slots (Master:
  "No. 0001 unclaimed"). A crewmate's top cards on their profile.
- **Achievements per skill** (`lib/mastery-achievements.ts`): obtainable goals from sessions and details; "14 of 17"
  in the trophy case. **Crew challenge** (`getCrewChallenge`, `ChallengeBar`): a monthly shared target a stretch
  above the crew's pace, on You, in the today panel and the desktop rail. Never a countdown.
- **Demo:** the crew reacts to milestone posts within seconds (🙌 👏 🔥).

## Demo AI (`lib/ai`)
A demo only: **no model, no API key, no server calls.** `lib/ai/writer.ts` writes from the crew's own data in the
brand voice; `lib/ai/demo.ts` delivers it like a model would (a short "reading" pause, then word-by-word streaming).
- **Weekly recap** (`components/you/CrewRecap.tsx`): "Your crew's week" on the **You tab** (under "This week"), not the
  feed: the feed stays minimal and extras are optional, on You. Crew chips pick which crew; "Write recap" runs a
  `TaskRun` (read, count, pick quotes, write, then "Share with the crew" asks first), the text streams in with a caret
  during the write step, and "Copy to share" copies it. Each "Rewrite" uses different phrasing and quotes
  different notes. Labeled "Demo AI, written on your device from this week's check-ins". Data: `getCrewWeek`.
- **Smart check-in** (`CheckInSheet`): with 2+ words in the note, "Tidy with AI" runs a `TaskRun` (read your note,
  match your crew's tags, then "Use the tidy version" asks first) and suggests a tidier note and up to
  three tags from the crew's own list; "Use this" / "Keep mine".
- Ben chose to keep it a demo (Oct 2026). If a real model is ever wanted, replace the two functions in `demo.ts`
  with calls to a server route; the screens don't change.

## Data
- Components import data only from `@/lib/data`, which re-exports the async functions in `lib/mock/api.ts`.
  New features add their functions there. Keep them async and returning view models (types in `lib/data/types.ts`),
  so a backend can replace the bodies later without touching components. There is no requirement to write a
  second (Supabase) version of anything.
- `useQuery(fetcher, deps, tables)` refetches when rows in those tables change.
- **Never hard-delete** in the data model: set `deleted_at` (hearts included). Account deletion is the one planned
  exception (App Store requirement). No PII in logs or analytics.
- **Backend reference:** branch `supabase` has a full Supabase data layer, email OTP sign-in, migration 018 and the
  schema decisions (`docs/supabase-gaps.md` there). It's a reference for later: don't merge it back.

## Brand voice
"Your crew", never followers or friends. "Yesterday slipped by", never "you broke your streak". "Welcome back".
No urgency, countdowns or FOMO. All-time check-in count is sacred; streaks are secondary. Sentence case, verbs on buttons.

## MCP servers
- **Arc** (`arc`): search, read the API, get the install command. Free items via `@uiarc/...`; Pro only if Ben owns it.
  Never paste paid (Pro) source from a preview page.
- **Tailgrids**: behavior and structure only; restyle fully.
- **ReUI** (if Ben added it): breadth for standard pieces; check its AGENTS.md rules don't contradict this file.
  Don't install ReUI, BoardUI or HeroUI without asking Ben.
- **Figma** / **Higgsfield** (if connected): tokens to Figma variables; portfolio assets only.

## Working agreement
- Work happens on a branch; Vercel builds a preview for every pushed branch. Merge to `master` once Ben approves.
- Commit after each phase. `npm run lint` and `npm run build` must pass.
- Compare against the prototype's flows at 390px, in light **and** dark, before moving on.
  Run `npx transitions-agent` before calling motion done.
