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
- `next-themes` (light / dark / system), `lucide-react` icons, fonts via `next/font/google` (Geist, Bricolage Grotesque)
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
- **Layout:** one centered column, `max-w-app` (640px). Bottom tab bar: Explore · Feed · You.
- **Modes:** both first-class; default follows the system; `ThemeToggle` on the You tab. Check every screen in both.

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
- **sonner (toasts):** inverted pill (`bg-foreground text-background`), above the tab bar.

## Motion
- **Chrome** (buttons, sheets, tabs, toasts, lists, page transitions): 150–200ms, `ease-out` on enter, `ease-in` on
  exit, transform and opacity only. Entrances `animate-rise`. Press `active:scale-[.97]`.
- **Delight moments** (springs allowed, `ease-spring`): check-in stamp, joy takeover, avatar check-badge pop, heart
  burst, chip selection, number tickers. The list is closed.
- Motion answers what people do. The only motion nobody triggered is live crew activity (arrivals, hearts).
- transitions.dev recipes are the default source for chrome motion; keep our durations and easing when adopting them.
- Always respect `prefers-reduced-motion` (globals.css zeroes animations; Arc components ship reduced-motion behavior).

## Product components (`components/checkin/`)
Build these with the primitives and the sources in `ui-references/check-in-map.md`:
- **GlassTabBar:** `bg-card/75 backdrop-blur-xl border shadow-raised rounded-full`, opaque fallback via
  `@supports not (backdrop-filter: blur(1px))`; active tab = `bg-foreground text-background` pill sliding (200ms).
- **CrewHero** (signature): `rounded-xl` card, single-hue gradient (`{hue}-soft` → transparent) over `bg-card`,
  big `font-display` "n/total" number ticker, "in today", brand-voice line, avatar row (faded + dashed ring until checked
  in, then a mint check badge pops on), segmented progress bar in the crew hue.
- **PostCard:** L1 card; avatar, name + relative time (plain text), note, interactive `TagChip`s, heart (ghost, fills
  rose when active) + mini stack of who hearted; own card gets a mint "Just in" badge for an hour; double-tap = heart burst.
- **HeatmapGrid:** 7 cells Mon–Sun; done = `bg-primary` + check; empty = `bg-muted`; future 40%; today = 2px ring;
  `animate-cellin` staggered when the You tab opens.
- **LivePill**, **Ticket** (invite code, crew-hue tint, letter tiles, `animate-wave` on copy), **JoyTakeover** (primary
  circle expands from the FAB via clip-path, "You showed up." words `animate-word`, count ticks up, confetti in crew hues).
- Feed background: `crew-glow` with `--crew` set to the active crew's hue variable (`HUE_CLASS[hue].cssVar`).
- **Behavior to keep** from the current build when these are rebuilt: sheets close on Escape, on a drag past ~110px or a
  fast flick, and trap focus; toasts auto-hide after ~2.2s; tapping the LivePill scrolls the feed to the top (or switches
  crew for an arrival elsewhere); JoyTakeover dismisses on tap or after ~2.9s and is the only confetti moment in the app.

## Screens (routes)
`/` intro · `/feed` · `/explore` · `/you` · `/group-settings/[groupId]` · `/new-group` · `/profile/edit` ·
`/manage-tags/[groupId]` · `/invite/[slug]` · `/kitchen-sink` (component reference).

## The demo (how the portfolio build behaves)
- **No accounts.** `/` shows the three-panel intro; "Get started" signs straight in as Ben (`lib/auth.tsx`). Sign out
  returns to the intro. Deep links (`/feed`, `/invite/...`) skip the intro. "Get started to join" on an invite page
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
