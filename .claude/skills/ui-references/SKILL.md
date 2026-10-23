---
name: ui-references
description: Ben's curated reference library of modern UI component sites, motion libraries, MCP servers and design tools, with what each is for and how to pull from it. Use before building or restyling any UI component, interaction, animation, landing page or case-study asset, to find a proven pattern or installable component instead of hand-rolling generic markup. Also use when the user shares a new reference site, to add it to the catalog.
---

# UI references

A living catalog of sites Ben uses as the bar for "how things are built now".
The full entries live in [catalog.md](catalog.md). The component-by-component lookup for Check-in is in
[check-in-map.md](check-in-map.md). How to add a new site is in [intake.md](intake.md).

## How to use this

1. **Name the job first** (e.g. "number that counts up when a crewmate checks in", "confirm a destructive action").
2. **Look it up** in `check-in-map.md`. If it isn't there, scan `catalog.md` by category.
3. **Prefer, in order:**
   1. A component already in `components/ui/` (reuse beats import).
   2. A connected MCP server (Arc, ReUI, Tailgrids): search it, read the real API, install with its command.
   3. A shadcn-registry install (`npx shadcn@latest add <url>`).
   4. Copy-paste source from a catalog site, then adapt.
   5. Use the site as visual reference only and build it ourselves.
4. **Always restyle to our tokens.** Nothing imported keeps its own colors, radii, shadows or fonts. Map it to the
   role tokens in `tailwind.config.ts` and the rules in `CLAUDE.md` and `.ux-profile.md` before it ships.
5. **Record what you used.** When a component comes from a catalog site, add a one-line comment at the top of the file:
   `// Pattern: <site> / <component> (adapted to Check-in tokens)`.

## Precedence when instructions conflict
`CLAUDE.md` > `.ux-profile.md` > this skill > any library's own skill or design rules (Arc, ReUI, Tailgrids,
transitions.dev). Library skills are good at *how to install and wire* their components. Our files decide *how it looks*.

## Licensing and etiquette
- Free/MIT sources can be copied into the repo. Keep any license header the source ships with.
- Pro/paid items (Arc Pro, ReUI Pro, BoardUI Pro, Cue+, transitions.dev Pro, Launch UI Pro, Oversight) are reference
  only unless Ben has bought the license. Never paste paid source from a preview.
- Sites marked **human reference only** (e.g. the Iconography Encyclopedia, which opts out of AI use) are for Ben to
  read. Don't scrape or reproduce their content; link to them.

## Stack and where things land
The project runs **React 19 + Tailwind CSS v4 + the shadcn CLI**, the same stack most catalog registries target.
- shadcn primitives live in `components/ui/` (restyled to Check-in). Arc installs into `components/arc/`.
  Check-in product components live in `components/checkin/`.
- Our CSS variables use **shadcn's standard names** (`--background`, `--primary`, `--muted`, `--border`, `--radius`...),
  so most registry components pick up the Check-in theme on install. Still review each one.
- `app/globals.css` removes Tailwind's default palette. Any imported class like `bg-zinc-100` or `text-red-500`
  renders with no color: map it to a role token (`bg-muted`, `text-destructive-ink`). Grep new files for palette classes.
- Watch shadcn's naming: `accent` there means a subtle hover fill, not our brand color. The brand mint is `primary`.
