# Supabase: gaps to close in Phase 6

Found while shaping `lib/mock/` against the migrations in the Expo repo (`CHECK-IN APP/supabase/migrations`, 001–017).
The mock already behaves the way the prototype needs; each item is where the live database would behave differently.

## Decisions needed

1. **Explore lists every crew.** `get_explore_groups` returns all live groups. There's no `is_public` column, so private friend crews show up in Explore.
2. **Unhearting hard-deletes.** `reactions` has no `deleted_at`, and the RLS allows delete. That breaks the "never hard-delete" rule. Either add `deleted_at`, or accept it for reactions.
3. **Delete account hard-deletes** (`delete_my_account`, migration 015). This is probably an intended exception to the rule because Apple requires it, but make that a conscious decision.
4. **The invite page shows member avatars** while signed out. `get_group_preview` returns no members, so it would need to expose names/colors publicly.
5. **Theme color.** RLS lets only the creator update a group, but the prototype lets any member pick the crew color.

## Fixes

6. **Streaks read 0 until you check in.** `get_group_streak`, `get_group_streaks`, `get_group_explore_details` and `get_user_public_profile` count back from `current_date`. If someone hasn't checked in *yet* today, their streak is 0, which contradicts "today's still open". The mock counts from yesterday when today is empty (`currentStreak` in `lib/dates.ts`). Also, `current_date` is the server's UTC date, not the user's local date.
7. **`create_my_group(p_name, p_invite_slug)`** can't set color or max size, but New crew needs both. Add parameters, or update the group right after creating it.
8. **Schema drift.** `groups.color` and `tags.deleted_at` are used by the RPCs and migration 003, but no migration creates them. They presumably exist on the live database; add a migration that records them.
9. **Avatar color is stored in two places.** `profiles.avatar_color` (migrations 004 and 017) vs `preferences->>'avatarColor'` (010). Pick the column.
10. **Asking again after a decline.** `join_requests` is unique on (group, user) and users can't update their own row, so a second request after a decline fails. That needs an RPC.

## Mock-only behaviour to remove

- An invite code that matches no crew joins the first open public crew (`joinGroupBySlug`), copied from the prototype so demo visitors get somewhere.
- The live simulation (`lib/mock/simulation.ts`): replace it with a realtime subscription on `check_ins` and `reactions`.
- `deleteAccount` resets the demo to its seeded state; the real one calls `delete_my_account` and signs out.
- "Sign out" just goes to `/` until email OTP auth exists.
- Profile photos are kept as data URLs on the profile; the real one uploads to Supabase storage (`avatars` bucket, migration 005).
