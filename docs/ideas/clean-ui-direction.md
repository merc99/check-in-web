# Clean UI: audit and direction

Branch `feat/clean-ui` (from `feat/mastery-2`). Method: the unslop skill (Damir Sokolovsky, @heydamir, CC BY 4.0)
plus Ben's 16 reference shots (Rivals, Crextio, the invoice dashboard, Data API, Virtus, the Chord cards,
Steam profile, Halmatec, NoteWise, Themes, Chattery Echo). The order of precedence in `CLAUDE.md` still holds;
this doc updates it where we change direction.

## What the references agree on

- Flat neutral surfaces in a few close greys. Depth from surface steps and hairlines, not glow or gloss.
- One accent, used rarely (the primary action, the selection, the one number that matters).
- One bright button per screen; everything else is a quiet grey pill.
- Card header: round icon, title, muted subtitle, optional segmented toggle on the right.
- Big medium-weight numbers with a small muted unit ("2/5", "67%"), small figures and axes in mono.
- Rows split by hairlines inside one card, not stacked boxes.
- Charts: one accent per chart, the rest neutral; a dashed line for the previous period or the target;
  hatched segments for "not yet".
- Color lives in content: avatars, photos, tier cards, chart marks, status dots.

## Audit (what the app does today)

Surfaces and color
- Feed banner: full crew-hue `CrewSurface` with `HoloBanner` (hue to hue gradient, sheen loop).
- You stat cards: three glossy hue panels (mint, orange, violet) with colored glow shadows.
- Desktop rail: `CrewHero` is a glossy hue panel with `AuroraFrame`; leaderboard is a glossy lemon panel.
- Posts: a colored edge down the left per author, yours with a mint wash; `SheenOnce` on arrival.
- Join request: dashed mint border plus a mint wash; pinned note: a tinted sky panel.
- Feed background: `crew-glow` radial wash in the crew hue.
- Explore: cards in saturated crew colors on top of photos, a 3D carousel.
- Light mode: warm paper ramp (`#F1ECE2`) that tints every surface.

Type
- `font-display` (Bricolage 600 to 800) in 56 places, `font-bold/extrabold` in 63, tight tracking in 22.
- Titles at 800 ("DIALED", "Ben", "Committed", section headings), numbers at 800.
- Mixed sizes: many one-off pixel sizes (`text-[12.5px]`, `text-[13px]`, `text-[22px]`...).

Spacing
- 430 arbitrary pixel values in components. Some are fine (on the 4px grid), many are not (`py-[10px]`,
  `px-[5px]`, `12.5px`).

Components
- Tag chips in hue tints on every post; reaction chips with hue borders.
- Stat cards carry sparklines and mini grids inside the hero stat.
- The heatmap and streak grids use filled squares; several equal cards side by side on You.

Motion
- Three loops (sheen, aurora, holo) on everyday surfaces; `SheenOnce` on every new post.

Copy
- Mostly good (brand voice is plain). A few labels end in periods; "This number never goes down." sits in a stat.

Verdict: light to medium slop. The product, voice and flows are designed; the surfaces carry too much color
and gloss, and the type is too heavy. Polish mode for flows, full passes for color, type and the stat screens.

## Direction

- **Product.** A habit tracker where a small crew (3 to 15 people) sees each other show up, and every check-in
  counts as a session toward a skill.
- **Character.** Steady, warm-hearted, a little competitive.
- **World.** The club noticeboard: a sign-in sheet, tally marks, a punch card, the session log in a training
  notebook.
- **Moments.** (1) The check-in itself: stamp, burst, your post landing. (2) Tier cards and the ceremony, with
  their materials. (3) The charts on You: your weeks and the crew's month toward its challenge. Color is rich
  only here.
- **Signature.** The tally: each member is one pill (mint when in, grey not yet, dashed if invited). It shows
  who's in today, the crew challenge and your week. Used there and nowhere else.

## The system

Neutrals: graphite ramp, both modes (drop the warm paper).
- Dark: deepest `#0f0f10`, page `#141415`, card `#1a1a1c`, raised `#232325`, hairline = text at 8%,
  text `#ededed` / `#a1a1a6` / `#85858b`.
- Light: page `#f6f6f7`, card `#ffffff`, raised `#f0f0f2`, hairline = text at 8%, text `#171717` / `#525252` /
  `#737373`.

Accent: mint (`primary`), a few percent of a screen: the check-in action, selection, the one number that
matters, "in" pills.

Buttons: pills. Primary on dark = off-white with dark text (light mode: near-black with white text);
the check-in action stays mint. Secondary = raised surface + hairline. Lit top edge
(`inset 0 1px 0 rgb(255 255 255 / .08)`) on dark buttons and active tabs.

Type: Geist for everything, 400 and 500, 600 rarely. Geist Mono for small figures, meta and chart axes.
Big numbers Geist 500, tabular, with a small muted unit. Bricolage leaves the UI (see the open questions).

Radii: controls and inputs 10, cards 16, large panels and sheets 20, buttons, tabs and chips full pills.
Nested radius = outer minus padding.

Crew color: avatars, status dots, chart marks, tier cards, Explore cover photos, the crew's medal. Not on
banners, panels, post edges or page backgrounds.

Charts: muted grid, mono labels, one accent per chart, dashed previous period or target, hatched "not yet".

Effects that stay (moments): check-in burst and `success`, `flyArc`, `RevealCard`, `TierCeremony`, tier card
materials, `Foil` on unlocked achievements, `RollingCount`, reaction delights, cheer, `HoldButton`, toasts,
the invite `Ticket` sheen.
Effects that go: `HoloBanner`, `AuroraFrame`, `Gloss` panels and glow shadows, `SheenOnce` on posts,
`crew-glow`, colored post edges.

## Phases

A. Base: tokens (ramp, type, radii, shadows), primitives (button, card with header, segmented and underline
   tabs, chips, inputs, toggles, delta pill, tally), kitchen sink.
B. Feed (Rivals): quiet crew header with the tally, rows for the join request and pinned note, clean post cards,
   muted section headers, tab dock.
C. You (bento): stat row (all time as the hero number, streak, best, this week) with changes vs last period,
   one main chart (12 weeks, dashed previous), skills with a tier gauge, the crew challenge as a step chart
   toward a dashed target, leaderboard as a hairline list.
D. Desktop: a crew rail (medals) plus a quiet sidebar; the feed's right rail as plain cards.
E. Explore, settings (the Themes layout), sheets, the remaining screens.
F. Audit (`ux-audit`, unslop checklist), screenshots in both modes, docs (`CLAUDE.md`, `.ux-profile.md`).

## Decisions (Ben, Nov 3 2026)

- Feed banner: flat. The crew's color shows as a dot or medal, not a surface. `HoloBanner` goes.
- Type: Geist and Geist Mono everywhere. Bricolage Grotesque leaves the app (the wordmark keeps Satoshi).
- Primary button: off-white on dark, near-black on light. The check-in action stays mint.
