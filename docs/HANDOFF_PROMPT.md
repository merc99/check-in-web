# First prompt for Claude Code

Paste everything below the line into Claude Code, run from the folder where the web app should live.

---

Read `CLAUDE.md`, then open `prototype/check-in-prototype.html` and study it. That prototype is the approved design.
We're porting it into a real Next.js 14 + Tailwind app, phase by phase.

Before writing anything, check what's in this folder:
- If it's an **Expo / React Native** project (app.json, expo in package.json, NativeWind), stop and tell me.
  The web app needs its own Next.js project; don't mix it into the mobile app.
- If it's empty or only has these kit files, scaffold Next.js 14 with the App Router, TypeScript, Tailwind v3,
  ESLint and the `@/*` alias. Keep the kit's `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`,
  `lib/` and `components/ui/` files and wire them in rather than overwriting them.
- If it's already a Next.js app, merge the kit's tokens into the existing Tailwind config and tell me what you changed.

Then work in phases. Stop after each one, show me what's done, and wait for my go-ahead:

1. **Foundation.** Get the scaffold running with the brand tokens, fonts and grain. Build a `/kitchen-sink` page
   showing every `components/ui` piece in all its variants. Finish the remaining components listed in CLAUDE.md
   (Sheet, FormField, Toast, LivePill, TabBar, Segmented, HeatmapGrid). Use the Tailgrids MCP for Sheet, Tabs and
   Toast behavior where it actually saves work, restyled to our tokens.
2. **Mock data layer.** `lib/mock/` with typed data matching the Supabase schema, seeded like the prototype
   (5am Lifters, Sketchbook Daily, the explore crews), plus the live-arrival simulation as a dev-only hook.
3. **Feed.** Large-title header that collapses on scroll, CrewHero, join requests, PostCard with hearts and
   double-tap, FAB, check-in sheet with the stamp submit, JoyTakeover.
4. **Explore and You.** Explore list with search and the detail sheet. You tab with count-ups, heatmap and achievements.
5. **Crew screens.** Group settings with the Ticket, New crew with the live preview card, Manage tags, Invite landing.
6. **Supabase.** Swap the mock layer for real queries, RPCs and realtime. Add the email OTP sign-in and profile setup.

Match the prototype's spacing, type sizes and motion closely. When you have to choose, follow CLAUDE.md.
