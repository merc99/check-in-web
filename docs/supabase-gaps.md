# Supabase: decisions, fixes and going live

> **Reference branch.** This `supabase` branch holds the Supabase data layer, OTP sign-in and
> migration 018 as they stood on 2026-10-22. `master` went fake-data only for the portfolio build
> and a reskin. Don't merge this branch back: port what's still useful once the reskin settles.
> A copy of the migration is at `supabase/migrations/018_web_app.sql` (never applied).

The gaps found while building the mock layer against migrations 001–017 are closed by
**`CHECK-IN APP/supabase/migrations/018_web_app.sql`** (kept with the other migrations,
since both apps share one database).

## Decisions (Oct 2026)

| # | Question | Decision | Where |
|---|---|---|---|
| 1 | Explore listed every crew | **Private by default.** `groups.is_public`, off for new and existing crews. The creator turns on "Show in Explore" in crew settings. | 018; crew settings switch |
| 2 | Unhearting hard-deleted | **Soft-delete hearts.** `reactions.deleted_at`; `set_heart` RPC. The delete policy is dropped. | 018; both data layers |
| 3 | Invite page avatars signed out | **Initials and colors only.** `get_group_preview` returns `{initial, color}`. | 018 |
| 4 | Who changes theme color | **Creator only** (unchanged RLS). | — |
| 5 | Delete account hard-deletes | **Keep real deletion.** The one documented exception to "never hard-delete" (App Store requirement). | CLAUDE.md |

## Fixes in 018

- **Streaks**: shared `streak_days` / `member_streak` / `crew_streak` helpers count back from the caller's local date (`p_today`), starting at yesterday when today has no check-in yet. Used by `get_group_streak(s)`, `get_group_explore_details` and `get_user_public_profile`.
- **`create_my_group`** takes color, max size and visibility (all with defaults, so the Expo app's 2-argument call still works).
- **Schema drift** recorded: `groups.color`, `tags.deleted_at`.
- **Avatar color**: `get_group_explore_details` reads `profiles.avatar_color` and falls back to the old `preferences` key.
- **`request_to_join`** RPC: works again after a decline, and only for public crews.
- **Own check-ins are always readable**, so leaving a crew can't lower your all-time count.
- **`create_check_in`**: check-in, new tags and tag links in one atomic call, once per crew per local day.
- **Realtime** publication covers `check_ins`, `reactions`, `group_members`, `join_requests`, `tags`, `groups`, `profiles`.
- **`get_explore_groups`** returns streak, avatar preview and your status (member / pending) in one call.

## Going live with Supabase

1. **Wake the project.** On 2026-10-22 `gpcynqgvmkpbptutfrov.supabase.co` didn't resolve, which usually means it was paused. Restore it in the dashboard.
2. **Apply 018.** Paste it into the SQL editor and run it. It's written to be safe on the live project.
3. **Check the email template.** Auth → Email templates → Magic Link must include `{{ .Token }}` so people get a 6-digit code. The Expo app already signs in by code, so it probably does.
4. **Set** `NEXT_PUBLIC_DATA_SOURCE=supabase` in `.env.local` (and in the host's environment), then restart.
5. **Test the sign-in flow yourself**: new account → profile setup → create a crew → check in from a second account → hearts and arrivals show up live.

## Effects on the Expo app (until it's revamped)

- Unhearting deletes the row, and the delete policy is gone, so **unhearting silently does nothing on mobile**. Its reaction counts also include soft-deleted hearts. Switch it to `set_heart`.
- Explore on mobile only shows public crews now.
- Everything else is compatible: new RPC parameters all have defaults.

## Mock-only behaviour (`NEXT_PUBLIC_DATA_SOURCE=mock`)

- "Get started" signs straight in as Ben; there's no email step (like the prototype).
- An invite code that matches no crew joins the first open public crew.
- The live simulation fakes crew arrivals and hearts.
- Delete account resets the demo; photos stay as data URLs.
