# Check-in (web) — project guide for Claude Code

Social habit tracker for small crews (3–15 people). Brand line: **"No shame days, just show up."**
This is an accountability app, not a productivity app. The crew is the emotional core, not the individual streak.

The approved visual and interaction reference is `prototype/check-in-prototype.html`. It's a single-file
HTML/JS prototype with mock data. **Port it faithfully into Next.js + Tailwind; don't redesign it.** When this
file and the prototype disagree, this file wins.

## Stack (fixed)
- Next.js 14, App Router, TypeScript
- Tailwind CSS v3 (`tailwind.config.ts` in this repo holds every brand token)
- Supabase: auth (email OTP), Postgres, storage, RPCs. Already live; the frontend is the job.
- Path alias `@/*` → project root.

## Design system rules (non-negotiable)
- **Colors:** only the tokens in `tailwind.config.ts`. The config *replaces* Tailwind's palette, so `bg-blue-500`
  won't exist. Never add a hex value in a component. Overlays use ink with alpha (`bg-ink/40`).
- **Dynamic colors:** never build class names at runtime (`bg-${color}`). Use `COLOR_CLASS` from `lib/colors.ts`.
- **Shadows:** solid ink offsets only, never blurred: `shadow-sh1` (chips), `shadow-sh2` (cards), `shadow-sh3`
  (buttons, CTAs, hero cards). Pressed state shrinks the shadow and translates down by the same amount.
- **Borders:** `border border-ink` (DEFAULT width is 1.5px) on cards, buttons, chips, inputs, avatars.
- **Radii:** `rounded-tiny` 4, `rounded-input` 12, `rounded-card` 14, `rounded-lg` 18, `rounded-full`.
- **Spacing:** stick to Tailwind steps 1, 2, 3, 4, 5, 6, 8, 12, 16 (4–64px).
- **Type:** `font-display` (Bowlby One) for titles, big numbers and day labels; `font-sans` (Inter 400/500/700)
  for everything else. Numbers that change get `tnum`.
- **Layout:** one centered column, `max-w-app` (640px), peach page, bottom tab bar: Explore · Feed · You.
- **Light only.** The palette is fixed; don't add dark-mode variants.
- Always respect `prefers-reduced-motion` (globals.css already zeroes animations).

## Components (build these first, in `components/ui/`, then reuse; never rebuild one inline)
Already scaffolded: `Button`, `TagChip` / `ToggleChip`, `Avatar`, `Card`. Still to build, matching the prototype:
- **Sheet** (bottom sheet): drag handle, spring open (`ease-spring`), drag-to-dismiss past ~110px or a fast flick,
  backdrop `bg-ink/40`, Escape closes, focus trapped inside. Radius `rounded-t-lg`.
- **FormField**: tiny uppercase label + optional "optional" marker, input with `shadow-sh2`, `focus:shadow-focus`, hint below.
- **Toast**: ink pill, peach text, springs up above the tab bar, auto-hides ~2.2s.
- **LivePill**: white pill that drops from the top ("Dre just checked in"), tap scrolls the feed to top.
- **TabBar**: three tabs, an ink indicator pill that slides between them (transform, spring).
- **Segmented**: two-option switch with sliding ink indicator (New crew: Create / Join with code).
- **HeatmapGrid**: 7 cells Mon–Sun. Checked = mint + check, empty = peach-deep, future = dimmed, today = ink outline.
  Cells pop in staggered when the You tab opens.
- **CrewHero** (signature element): card filled with the crew color, big `font-display` "n/total in today",
  brand-voice line top right, row of avatar stickers (dashed + faded until that person checks in, then a mint
  check badge pops on), segmented progress bar underneath.
- **PostCard**: avatar, name + relative time, note, tag chips, heart pill + mini stack of who hearted.
  Own card uses `bg-card-alt` and a mint "JUST IN" badge for an hour. Double-tap = heart with a burst.
- **Ticket**: invite code card in the crew color, letter tiles, perforated divider with notches; letters wave on copy.
- **JoyTakeover**: on check-in, a mint circle expands from the FAB (clip-path), "You showed up." words spring in,
  check-in count rolls up, confetti in tag colors, tap or ~2.9s to dismiss. The only rainbow/confetti moment in the app.

## Motion spec
- Spring: `cubic-bezier(.34,1.45,.64,1)`; ease-out: `cubic-bezier(.2,.8,.2,1)`. Both are Tailwind `ease-spring` / `ease-out`.
- Press: 120ms. Chips/hearts: 200–350ms spring. Sheets: 500ms spring. Joy reveal: 700ms.
- Only animate transform, opacity and clip-path. Motion answers user actions; the only ambient motion is live crew arrivals.
- Route transitions: View Transitions API where supported (`document.startViewTransition`), fade + 14px rise.
  Optional; skip if it fights the App Router.

## Screens (routes)
`/` intro + sign-in · `/profile-setup` · `/feed` · `/explore` · `/you` · `/group-settings/[groupId]` ·
`/new-group` · `/profile/edit` · `/manage-tags/[groupId]` · `/invite/[slug]` (public, works signed out).
The prototype skips sign-in on purpose; the real app keeps the email OTP flow from the brief.

## Data
- Build every screen against a typed mock data layer first (`lib/mock/`), shaped exactly like the Supabase
  schema, behind functions like `getFeed(groupId)` / `checkIn(...)`. Swap the internals to Supabase later
  without touching components.
- Supabase client: `flowType: 'implicit'`, `autoRefreshToken: true`, `persistSession: true`.
- Use the RPCs listed in the brief instead of raw queries where one exists.
- **Never hard-delete.** Always set `deleted_at`.
- Realtime: subscribe to `check_ins` for the active group; new rows drive the same arrival animation the
  prototype fakes with its live simulation.
- No PII in logs or analytics.

## Brand voice
- "Your crew", never followers or friends.
- Missed days: "yesterday slipped by", never "you broke your streak". Returning: "Welcome back".
- No urgency, countdowns or FOMO. All-time check-in count is sacred and never goes down; streaks are secondary.
- Sentence case. Buttons say exactly what happens ("Create crew", "Send code").

## Using Tailgrids (MCP is installed)
Use Tailgrids for **behavior and structure** where it saves real work (Sheet/Drawer, OTP Input, Tabs, Toast,
Dialog). Every Tailgrids component must be restyled to the tokens above before it ships; none of its default
colors, blurred shadows or radii may survive. If restyling takes more code than writing it, write it.

## Working agreement
- Commit after each phase. Run `npm run lint` and `npm run build` before calling a phase done.
- Compare each screen against the prototype side by side at 390px wide before moving on.
