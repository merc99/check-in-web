# Catalog

Last reviewed: October 2026. Entries describe what the site offered when reviewed; check the site before relying on a detail.
Legend: **Fit** = how useful for Check-in (High / Medium / Low / Portfolio). **Use** = how to pull from it.

---

## Component libraries with MCP or agent tooling

### Arc UI: https://uiarc.dev/
- **What:** 183 animated React components and 110 blocks for shadcn + Next.js, built for AI agents.
- **Use:** Remote MCP server (`claude mcp add --transport http arc https://uiarc.dev/api/mcp`, free account),
  agent skill (`npx shadcn@latest add https://uiarc.dev/r/arc-skill.json` → `.claude/skills/arc`), shadcn registry
  (`@uiarc` in `components.json`), and `llms.txt` / per-component markdown.
- **Cost:** Free tier plus Pro ($249 once) for motion-heavy pieces.
- **Fit:** High. Bottom sheet, hold to confirm, swipe actions, reactions, segmented control, animated counter, activity
  heatmap, avatar group, toast stack, theme switch, onboarding checklist, confirm morph.
- **Watch:** Ships its own design rules in its skill; ours win. Imports `foundation.css`; map its tokens to ours.

### ReUI: https://reui.io/components
- **What:** 1,264+ free shadcn/ui components and examples, plus in-house Data Grid, Kanban, Filters, Calendar, Stepper,
  Timeline, File Upload. Radix and Base UI flavors. MIT.
- **Use:** Free MCP (`https://mcp.reui.io`, browser sign-in on first connect) with scored search and `validate_usage`;
  Agent Skills via `curl -fsSL https://mcp.reui.io/install | node -`; shadcn CLI installs.
- **Cost:** Free components; Pro blocks from $249.
- **Fit:** Medium-High. Breadth for standard pieces: empty states, OTP input, stepper (onboarding), timeline, sonner toasts.
- **Watch:** Dashboard-leaning aesthetic. The install script writes a design-rules block into AGENTS.md; check it
  doesn't contradict CLAUDE.md.

### Tailgrids: https://tailgrids.com/
- **What:** Open-source React + Tailwind component library (Tailgrids v3) with blocks and templates; already connected via MCP.
- **Use:** MCP `npx -y @tailgrids/mcp@latest`. LLMs.txt and DESIGN.md published.
- **Fit:** Medium. Behavior and structure for Sheet, Drawer, OTP Input, Tabs, Toast, Dialog. Restyle fully.

### BoardUI: https://www.boardui.com/
- **What:** React design system for dashboards and agentic interfaces: 85 components incl. 19 chart cards, React Aria,
  TanStack Table, Tailwind v4, 400+ tokens, Figma kit. MCP support.
- **Use:** MCP (setup guide at https://www.boardui.com/mcp), CLI install, free tier on GitHub (MIT).
- **Cost:** Free Starter; Pro €149–€349.
- **Fit:** Low-Medium. Reference for "playful widgets" (activity rings, streak/contribution cards) and stat tiles.
- **Watch:** A whole design system; don't mix its tokens with ours.

### HeroUI (formerly NextUI): https://heroui.com/
- **What:** Accessible React components on React Aria + Tailwind v4 (v3 of the library), plus **HeroUI Native** for
  React Native / Expo. llms.txt, markdown docs, MCP packages.
- **Fit:** Low for the web app (it's a full competing system). **Worth a look for the Expo mobile app** via HeroUI Native.
- **Watch:** Mixing HeroUI with shadcn-based pieces gives two component systems. Pick one per app.

### Launch UI: https://www.launchuicomponents.com/
- **What:** Landing-page blocks and templates on React, shadcn/ui and Tailwind v4, with themes, radius and light/dark
  switches. Free tier open source; Pro $99 once. Figma file free.
- **Fit:** Portfolio. Best source for a Check-in marketing/landing page. Not for in-app screens.

---

## Motion and micro-interaction sources

### Transitions.dev: https://transitions.dev/
- **What:** 43+ crafted UI transitions (card resize, number pop-in, tabs sliding, toast, modal, like button, success
  check, skeleton reveal, spinning counter, avatar group hover, error shake), a builder, a Motion Agent, and an agent skill.
- **Use:** Skill `npx skills add Jakubantalik/transitions.dev` (commands: `transitions reveal / review / apply / refine`);
  Polish add-on `-s transitions-polish`; Motion Agent `npx transitions-agent` scores the codebase's motion 0–100.
- **Cost:** Free library; Pro for some recipes (confetti burst, card stack, spinner-to-check).
- **Fit:** High. The motion layer for Check-in chrome, and a motion QA pass before shipping.
- **Watch:** Its token scale may differ from `.ux-profile.md`; keep our durations and the delight-moment list.

### Bencho: https://bencho.dev/
- **What:** 140+ live interactive React blocks and micro-interactions (press, drag, hover, swipe, type), plus sounds.
- **Use:** Copy from each block page.
- **Fit:** High for delight: confetti, rolling counter, avatar group, emoji reactions, swipe deck, pull to refresh,
  tab bar, checklist, ticket, one-time code, toast stack, slide to confirm, dynamic island.

### Feral UI: https://feralui.dev/
- **What:** Small library of playful, physics-driven React elements (Verlet-rope pull cord, claw-machine captcha).
- **Fit:** Medium. Inspiration for one signature playful moment (e.g. a pull-to-check-in easter egg). Use sparingly.

### Reverse UI: https://reverseui.com/
- **What:** 68 premium animated components (Framer Motion): proximity navigation, radial menu, dock, like button,
  stacked cards, text effects, shaders, particles.
- **Cost:** Paid lifetime access for most.
- **Fit:** Low-Medium in-app (like button, stacked cards, navigation indicator). Better for marketing/portfolio visuals.

### Cue: https://www.cuedesign.space/
- **What:** Curated "Awwwards-tier" animations, hero flows and interactions; each ships with an AI prompt for
  Claude/Cursor/v0. Cue+ $99 lifetime.
- **Fit:** Portfolio. Hero and scroll moments for the landing page or case study.

### Aura: https://www.aura.build/components?componentType=free
- **What:** AI landing-page builder with a component library (free and paid), export to HTML and Figma.
- **Fit:** Portfolio. Landing page drafts and hero ideas. Page is JS-rendered; browse it in a real browser.

### Opensource UI: https://opensourceui.in/components
- **What:** 207+ free copy-paste React/Next.js + Tailwind components in 30 categories, with live previews (MIT per site).
- **Use:** Copy source from each page.
- **Fit:** High. Daily activity calendar (streak grid), like toggle with particles, segmented control, OTP boxed input,
  toast, hold-to-delete, slide-to-confirm, progress ring, event ticket and circle-cut frame (invite ticket),
  hydration/step widgets (habit-tracker vibes), iPhone mockups (portfolio screenshots).

---

## Specialized registries

### Gauge UI: https://www.gauge-ui.dev/
- **What:** Composable SVG gauge primitives (arcs, ticks, zones, needles) as a shadcn registry, plus a studio.
- **Use:** `npx shadcn@latest add https://gauge-ui.dev/r/gauge.json`
- **Fit:** Medium. A crew-progress dial or weekly-goal ring on the You tab.

### audiocn: https://www.audiocn.dev/
- **What:** Audio UI for React/shadcn: mixer, faders, knobs, waveforms, meters, players.
- **Use:** `pnpm dlx shadcn@latest add @audiocn/<name>`
- **Fit:** Low for Check-in (unless voice-note check-ins happen). Useful for music/Squeaky Feet-type projects.

### mdxcn: https://www.mdxcn.dev/
- **What:** Markdown-friendly React components for MDX (callouts, steps, timelines, text-drawn charts). Shadcn Labs. MIT.
- **Use:** `pnpm dlx shadcn@latest add https://mdxcn.dev/r/all.json`; agent skill at https://www.mdxcn.dev/agents
- **Fit:** Portfolio. Case-study pages written in MDX.

### Pele: https://pele.run/
- **What:** Renders Mermaid diagrams to lightweight SVG themed with CSS variables (from Obsidian). MIT.
- **Use:** `npm install pele`
- **Fit:** Portfolio. User-flow and architecture diagrams in the case study, themed to the brand.

---

## Templates and sections

### Oversight Supply: https://supply.madebyoversight.com/
- **What:** 192 premium Webflow/Framer templates, 32 free sections you can paste into Claude Code, and **Claude skills
  for making explainer videos**.
- **Fit:** Portfolio. Case-study site sections and an explainer/promo video for Check-in.

---

## Research and craft references

### The Component Gallery: https://component.gallery/components/button/
- **What:** Every common component documented across 100+ real design systems, with markup, usage and accessibility notes.
- **Use:** Look up how mature systems handle a component before designing ours (start at https://component.gallery/components).
- **Fit:** High as research. No install.

### The Iconography Encyclopedia: https://encyclopedia.iconography.co/#view=directory
- **What:** A field guide to icon design vocabulary and craft (stroke, key lines, optical corrections, icon systems).
- **Fit:** High for the custom Check-in icon set. **Human reference only**: the site opts out of AI use.

---

## Design tools

### squig: https://squig.sh/
- **What:** Infinite canvas of real UI components rendered as napkin sketches, for wireframing structure.
- **Fit:** Medium. Fast wireframes for new screens before high-fidelity work.

### Squints: https://squints.app/
- **What:** Free Chrome extension: measure spacing, inspect type and colour, overlay grids, slow down and scrub animations
  on any live page.
- **Fit:** High for QA. Check localhost against the reference sites; slow the joy takeover to a tenth of speed.
