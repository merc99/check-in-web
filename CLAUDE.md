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
- `next-themes` (light / dark / system), `lucide-react` icons, fonts via `next/font/google` (Geist, Bricolage Grotesque) and `next/font/local` (Satoshi Black, the wordmark only)
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
- `components/checkin/`: Check-in product components (`TagChip`, `ToggleChip`, `CrewAvatar`, `ThemeToggle`, and the
  ones listed under *Product components*). Build once, reuse, never restyle inline.
  It also holds the pre-upgrade components (PascalCase files, e.g. `Button.tsx`, `Sheet.tsx`). Screens move to the
  shadcn primitives and the new product components one at a time; delete an old file once nothing imports it.
- Screen-specific pieces live next to their screen's folder (`components/feed/`, `components/explore/`, ...).
- `/kitchen-sink` shows every `components/ui` and `components/checkin` piece in every state. Add new pieces there too.
- Any file adapted from a catalog site starts with `// Pattern: <site> / <component> (adapted to Check-in tokens)`.

## Visual system: modern, playful, light + dark
Every value is a CSS variable in `app/globals.css` (`:root` = light, `.dark` = dark). Names follow **shadcn's standard**,
plus a few Check-in extras, so registry components inherit the theme.

- **Never** write hex, `rgb()`, or Tailwind palette colors in components. The theme removes the default palette
  (`--color-*: initial`), so `bg-zinc-100` renders nothing. Imported components: grep for palette classes and map them.
- **Never** build class names at runtime (`bg-${hue}`). Use `HUE_CLASS` from `lib/colors.ts`.
- **Surfaces:** `bg-background` (canvas) → `bg-card` (cards, lists, L1) → `bg-muted` (inputs, tracks, hover, L2) →
  overlays `bg-popover` + `shadow-overlay`. Lists are L1 surfaces with hairline dividers.
- **Text:** `text-foreground`, `text-muted-foreground`, `text-subtle-foreground`; `text-on-color` on solid crew hues.
- **Lines:** `border` (default color is `--border`) everywhere; `border-border-strong` for inputs, secondary buttons, hover.
- **Brand accent = `primary` (mint).** `bg-primary text-primary-foreground` for primary buttons and active states,
  `text-primary-ink` for links and mint text, `bg-primary-soft` for tinted highlights, `ring` for focus. About 10% of a screen.
  Note: shadcn's `accent` token is a neutral hover fill, not the brand color.
- **Destructive:** `bg-destructive-soft text-destructive-ink` (soft) or `bg-destructive text-white` (solid, rare).
- **Crew hues** (coral, sky, rose, grape, lemon, leaf, clay, indigo): content color per the playful layer.
  `bg-{hue}-soft text-{hue}-ink` for tints; solid `bg-{hue}` only for avatars, dots and small badges.
  Mint is not a crew or avatar hue (it's `primary`); demo data that used mint now uses leaf.
- **Shadows:** `shadow-xs`, `shadow-sm` / `shadow-card` (L1), `shadow-raised` (hover / lifted), `shadow-overlay`
  (sheets, menus), `shadow-you` (the signed-in user's avatar ring). Soft in light mode, edge-lit in dark.
- **Radii:** `rounded-md` 10 (inputs, small controls), `rounded-lg` 16 (cards), `rounded-xl` 22 (large cards, sheets),
  `rounded-full` (buttons, chips, avatars).
- **Type:** `font-display` (Bricolage Grotesque 600–800) for titles, crew names, big numbers, with `tracking-tighter`
  (titles) or `tracking-tightest` (numbers 40px+). `font-sans` (Geist) for everything else. Changing numbers get `tnum`.
- **Logo:** `BrandMark` / `LogoMark` (components/checkin/BrandMark.tsx): the red → yellow → green gauge with a check, and
  the wordmark "check-in" in Satoshi Black (`font-wordmark`, `app/fonts/`), lowercase. Only the wordmark uses it. `size="lg"` adds "stay consistent with
  people." (the signed-out welcome screen at `/`). Don't redraw it elsewhere.
- **Layout:** phones get one centered column, `max-w-app` (640px), with the bottom tab bar: Explore · Feed · You.
  Desktop (`lg`, 1024px+) gets `AppSidebar` (tabs + your crews) instead of the tab bar and FAB, in a shell up to
  1600px. Pages stay one centered column unless their `<main>` sets `data-layout="wide"`: the feed (one column of posts,
  up to 760px, + a sticky right rail with check-in, `CrewHero` and your week), Explore (the ring at full size,
  crews in two columns) and You (glossy stat cards, then two columns: week, achievements, recent | leaderboard, crews). Sheets open as centered dialogs on desktop (`ResponsiveSheet`, or the CSS in `Sheet`).
  Use `lg:` classes where CSS can do it, `useDesktop()` (`lib/viewport.ts`) only where JS must choose.
- **Modes:** both first-class; **dark by default** (`defaultTheme="dark"`); You → Settings switches to light or system. Check every screen in both.

### shadcn primitive specs (apply after `shadcn add`)
- **button:** `rounded-full font-semibold`, sizes `sm` h-9 px-4 text-[13px], `default` h-12 px-6, `lg` h-14 px-8,
  `icon` size-11. Variants: `default` = `bg-primary text-primary-foreground shadow-card` + faint top highlight
  (`bg-[linear-gradient(rgb(255_255_255/.18),transparent)]`); `secondary` = `bg-card border border-border-strong
  shadow-card hover:bg-muted`; `outline` = same as secondary without shadow; `ghost` = `text-muted-foreground
  hover:text-foreground hover:bg-muted`; `destructive` = `bg-destructive-soft text-destructive-ink`; `link` =
  `text-primary-ink underline-offset-4`. Press: `active:scale-[.97]`, 150ms ease-out.
- **card:** `rounded-lg border bg-card shadow-card`; padding 16 (20 for large); interactive cards lift
  (`hover:-translate-y-px hover:border-border-strong hover:shadow-raised`).
- **input / textarea:** `h-12 rounded-md border-border-strong bg-card`, focus = 3px `ring-primary/25` + `border-primary`.
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
Loops are scoped to exactly one place each (three: the ticket sheen, the aurora frame, the banner's holo gradient). Nothing else idles. Never add a second effect to a surface that has one.

| Effect | Tier | Allowed only on |
|---|---|---|
| `Foil` + `FoilLight` (tilt, white sheen; one sweep on tap) | calm | Unlocked `AchievementCard`s, and inside the milestone reveal |
| `SheenLoop` (holo sheen, loops) | scoped loop | Invite `Ticket`s (crew settings, the invite page) |
| `AuroraFrame` (turning multicolor edge, soft glow) | scoped loop | `CrewHero`, only while the whole crew is in today |
| `HoloBanner` (slow drifting hue tones + a rose/sky/lemon foil sheen) | scoped loop | The feed's crew banner only |
| `burstFrom` (canvas particles, crew hue + mint) | moment | After a check-in, from the button used (FAB or rail button) |
| `flyArc` + `squash` (arc, tilt, land) | moment / calm | The day's first check-in (+1 to the streak: rail on desktop, You tab on phones); reactions landing on their chip |
| `RevealCard` (shake, beam, hue flood, burst) | moment | When a check-in unlocks an achievement. Nowhere else |
| `RollingCount` (odometer digits) | calm | Every number that changes: stats, the crew hero, streaks, reaction counts |
| `HoldButton` (hold to confirm, no sheet) | calm | Destructive actions only: delete a crew or your account, leave a crew, remove a member |
| Toast stack (frosted, batched) | calm | Confirmations and live news; up to three, 4.2s, tap to dismiss |
| Frosted glass (`--fx-glass` + blur, opaque fallback) | calm | The tab dock and toasts |
| `Gloss` + `GlossPill` + `GlassInset` (glossy hue panel, mmo-style) | calm (static) | `CrewHero`, the You stat cards, the crew leaderboard, the Explore ring's cards (each in its crew's color) |
| `Sparkline` (draws in once) | calm | Inside a `Gloss`: the crew's last 14 days, your last 12 weeks |
| `SheenOnce` (one holo pass) | calm | A feed post as it arrives (yours or a crewmate's) |
| Arrival burst (`burstFrom`, small) | live activity | A crewmate's sticker in the hero when they check in |
| Whole-crew burst (`burstFrom`, once) + "all in" pop | moment | Phones: the TodayStrip, when the last member checks in while you watch (not on load or a crew switch) |
| `animate-handwave` (👋 pops and wiggles) | delight | A crewmate's sticker after you wave at them |
| Banner swipe (follows the finger, slides out/in 150/200ms) | calm | Phones: the feed banner, to move between your crews |
| `LogoMark` shimmer (one sweep) | calm | The logo: once when it appears, and on hover. Never loops |
| Sparkline scrub (guide, dot, label) | calm | Every `Sparkline`: hover, drag or arrow keys show one point; no resting dot |
| Hover lift / press | calm | Post cards, Explore crew cards, leaderboard rows, ring chart legend, heatmap and streak squares |

**Sound** (`components/fx/sound.ts`): off by default; You → Settings → Sounds. `success` after a check-in, `tap` when
picking a reaction, `charge` / `confirm` on hold buttons, `levelUp` on a milestone reveal. No other sounds.
**Not used** (judged on `/fx-preview` and the live demo): white pointer lights and glows on colored surfaces,
dark press shading on cards, metallic text and metal buttons, rarity tiles, parallax art, liquid glass
refraction, light rings as default borders, the full-screen joy takeover.

## Product components (`components/checkin/`)
Build these with the primitives and the sources in `ui-references/check-in-map.md`:
- **GlassTabBar:** `bg-card/75 backdrop-blur-xl border shadow-raised rounded-full`, opaque fallback via
  `@supports not (backdrop-filter: blur(1px))`; active tab = `bg-foreground text-background` pill sliding (200ms).
- **Crew look** (`lib/crewStyle.ts`): each crew has a color, an `emoji` (on its `CrewBlock`, else the first letter)
  and a cover `pattern` (`CrewCover`: dots, stripes, waves, grid, confetti, plain). Owners pick all three in crew
  settings (`components/crew/CrewLook.tsx`). Banners and Explore cards wear the cover, so no two crews look alike.
- **TodayStrip** (phones): who's in today folded into the feed banner, one row of stickers + "n/total"; tapping it
  opens the brand line, the 14-day sparkline and the bar. The full `CrewHero` shows only in the desktop rail.
- **CrewHero** (signature, desktop rail): `rounded-xl` card, single-hue gradient (`{hue}-soft` → transparent) over `bg-card`,
  big `font-display` "n/total" in `RollingCount`, an `AuroraFrame` while the whole crew is in, "in today", brand-voice line, avatar row (faded + dashed ring until checked
  in, then a mint check badge pops on), segmented progress bar in the crew hue.
- **PostCard:** L1 card with the author's color down the left edge (yours: mint edge + faint mint wash); avatar, name + relative time (plain text), note, interactive `TagChip`s, `Reactions` (emoji
  chips from `lib/reactions.ts`, ❤️ first; yours are mint; the smiley opens the picker); own card gets a mint
  "Just in" badge for an hour; double-tap = heart burst and adds your ❤️.
- **AchievementCard:** unlocked ones are foil: filled with the achievement's hue, `text-on-color`, a dark enamel medal,
  white sheen that tilts toward the pointer. Locked ones stay dashed.
- **HeatmapGrid:** 7 cells Mon–Sun; done = `bg-primary` + check; empty = `bg-muted`; future 40%; today = 2px ring;
  `animate-cellin` staggered when the You tab opens.
- **LivePill**, **Ticket** (invite code, crew-hue tint, letter tiles, `animate-wave` on copy, `SheenLoop`).
- **CrewSurface** (`components/checkin/CrewSurface.tsx`): a crew's own surface, its hue with depth (deeper toward the
  bottom, a lighter tone of the same hue top right), film grain and a lit top edge; overlays on it are dark ink
  (`bg-black/10`), never white. `CrewMedal` is the crew's emoji as a dark enamel badge. Used by the feed banner,
  Explore card covers and the crew-look preview.
- **FeedHeader:** a compact crew banner (the feed leads) on a `CrewSurface` with `HoloBanner`: the name (display, extra
  bold, 24/28px), one line of date, members and crew streak as plain text, the gear, the TodayStrip on phones. No pattern and no emoji on the
  banner (Ben: the stripes and the emoji badge looked cheap). No glow, no pointer light. Scrolled, it collapses into a tinted sticky bar. The hero shows today, not the streak.
- **Check-in** (feed): stamp in the sheet → burst from the button + `success` → your post drops in → on the day's
  first check-in, +1 flies to the streak → a `RevealCard` if it unlocked an achievement, otherwise one toast.
- Feed background: `crew-glow` with `--crew` set to the active crew's hue variable (`HUE_CLASS[hue].cssVar`).
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
