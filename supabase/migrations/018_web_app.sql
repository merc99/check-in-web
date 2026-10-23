-- ============================================================
-- 018: Web app (check-in-web, Phase 6)
-- Closes the gaps listed in check-in-web/docs/supabase-gaps.md.
--
-- Decisions (Oct 2026):
--   • Crews are private by default; creators opt in to Explore (groups.is_public).
--   • Hearts are soft-deleted (reactions.deleted_at), like everything else.
--   • Signed-out invite pages show member initials + colors only.
--   • Only the creator changes a crew's color (unchanged RLS).
--   • delete_my_account stays a real delete: the one documented exception
--     to "never hard-delete" (App Store requirement; what people expect).
--
-- Safe to run on the live project: every change is additive or replaces a
-- function with a compatible signature (new params all have defaults, so the
-- Expo app's existing calls keep working).
-- ============================================================


-- ─── Schema drift: columns the live DB already has but no migration created ───
alter table public.groups add column if not exists color text not null default 'mint';
alter table public.tags   add column if not exists deleted_at timestamptz;


-- ─── Decision 1: public crews ───
alter table public.groups add column if not exists is_public boolean not null default false;


-- ─── Decision 2: soft-delete hearts ───
alter table public.reactions add column if not exists deleted_at timestamptz;

drop policy if exists "users can delete own reactions" on public.reactions;
drop policy if exists "users can update own reactions" on public.reactions;
create policy "users can update own reactions"
  on public.reactions for update
  using (auth.uid() = user_id);


-- ─── You can always read your own check-ins ───
-- Without this, leaving a crew hides your check-ins in it from you, and the
-- all-time count ("never goes down") would drop.
drop policy if exists "check_ins: users can read own" on public.check_ins;
create policy "check_ins: users can read own"
  on public.check_ins for select
  using (auth.uid() = user_id);


-- ─── Streaks ───
-- Count consecutive days back from p_today. If p_today has no check-in yet, start
-- from yesterday: today is still open, so the streak hasn't slipped.
-- p_today is the caller's local date (the web passes it; defaults to the server date).
create or replace function public.streak_days(p_dates date[], p_today date)
returns int
language plpgsql
immutable
as $$
declare
  v_n int := 0;
  v_d date := case when p_today = any(p_dates) then p_today else p_today - 1 end;
begin
  while v_d = any(p_dates) loop
    v_n := v_n + 1;
    v_d := v_d - 1;
  end loop;
  return v_n;
end;
$$;

-- One person's streak, in one crew (or across all crews when p_group_id is null).
create or replace function public.member_streak(p_user_id uuid, p_group_id uuid, p_today date)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select public.streak_days(
    array(
      select distinct local_date from public.check_ins
      where user_id = p_user_id
        and (p_group_id is null or group_id = p_group_id)
        and deleted_at is null
    ),
    p_today
  );
$$;
-- Internal helper: only the security-definer RPCs below call it.
revoke all on function public.member_streak(uuid, uuid, date) from public, anon, authenticated;

-- Consecutive days with at least one member check-in.
create or replace function public.crew_streak(p_group_id uuid, p_today date)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select public.streak_days(
    array(
      select distinct local_date from public.check_ins
      where group_id = p_group_id and deleted_at is null
    ),
    p_today
  );
$$;
revoke all on function public.crew_streak(uuid, date) from public, anon, authenticated;


drop function if exists public.get_group_streak(uuid);
create or replace function public.get_group_streak(p_group_id uuid, p_today date default current_date)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select public.crew_streak(p_group_id, p_today);
$$;


drop function if exists public.get_group_streaks(uuid);
create or replace function public.get_group_streaks(p_group_id uuid, p_today date default current_date)
returns table (user_id uuid, streak int)
language sql
stable
security definer
set search_path = public
as $$
  select gm.user_id, public.member_streak(gm.user_id, p_group_id, p_today)
  from public.group_members gm
  where gm.group_id = p_group_id
    and gm.deleted_at is null
    and public.is_group_member(p_group_id);
$$;
revoke all on function public.get_group_streaks(uuid, date) from public, anon;
grant execute on function public.get_group_streaks(uuid, date) to authenticated;


-- ─── Explore: public crews only, with streak, avatar preview and your status ───
drop function if exists public.get_explore_groups();
create or replace function public.get_explore_groups(p_today date default current_date)
returns table (
  id           uuid,
  name         text,
  color        text,
  description  text,
  created_by   uuid,
  max_members  int,
  member_count bigint,
  streak       int,
  preview      jsonb,
  is_member    boolean,
  has_pending  boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id, g.name, g.color, g.description, g.created_by, g.max_members,
    (select count(*) from public.group_members gm where gm.group_id = g.id and gm.deleted_at is null),
    public.crew_streak(g.id, p_today),
    coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'avatar_color', p.avatar_color, 'avatar_url', p.avatar_url) order by gm.joined_at)
      from (select * from public.group_members where group_id = g.id and deleted_at is null order by joined_at limit 4) gm
      join public.profiles p on p.id = gm.user_id
    ), '[]'::jsonb),
    public.is_group_member(g.id),
    exists (select 1 from public.join_requests jr where jr.group_id = g.id and jr.user_id = auth.uid() and jr.status = 'pending')
  from public.groups g
  where g.deleted_at is null
    and g.is_public
  order by 7 desc, g.created_at desc;
$$;
revoke all on function public.get_explore_groups(date) from public, anon;
grant execute on function public.get_explore_groups(date) to authenticated;


drop function if exists public.get_group_explore_details(uuid);
create or replace function public.get_group_explore_details(p_group_id uuid, p_today date default current_date)
returns table (user_id uuid, name text, avatar_color text, avatar_url text, streak int)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    coalesce(p.name, 'Member'),
    coalesce(p.avatar_color, p.preferences->>'avatarColor', 'mint'),
    p.avatar_url,
    public.member_streak(p.id, p_group_id, p_today)
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  join public.groups g on g.id = gm.group_id
  where gm.group_id = p_group_id
    and gm.deleted_at is null
    and g.deleted_at is null
    and (g.is_public or public.is_group_member(p_group_id))
  order by 5 desc, p.name;
$$;
revoke all on function public.get_group_explore_details(uuid, date) from public, anon;
grant execute on function public.get_group_explore_details(uuid, date) to authenticated;


-- ─── Invite preview: works signed out; initials + colors only ───
drop function if exists public.get_group_preview(text);
create or replace function public.get_group_preview(p_slug text)
returns table (
  id           uuid,
  name         text,
  color        text,
  member_count bigint,
  max_members  int,
  preview      jsonb,
  is_member    boolean,
  has_pending  boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id, g.name, g.color,
    (select count(*) from public.group_members gm where gm.group_id = g.id and gm.deleted_at is null),
    g.max_members,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'initial', upper(left(coalesce(nullif(trim(p.name), ''), '?'), 1)),
        'color', coalesce(p.avatar_color, 'mint')
      ) order by gm.joined_at)
      from (select * from public.group_members where group_id = g.id and deleted_at is null order by joined_at limit 5) gm
      join public.profiles p on p.id = gm.user_id
    ), '[]'::jsonb),
    auth.uid() is not null and public.is_group_member(g.id),
    auth.uid() is not null and exists (
      select 1 from public.join_requests jr where jr.group_id = g.id and jr.user_id = auth.uid() and jr.status = 'pending'
    )
  from public.groups g
  where g.invite_slug = upper(p_slug)
    and g.deleted_at is null;
$$;
grant execute on function public.get_group_preview(text) to anon, authenticated;


-- ─── Public profile: streaks counted the same way ───
drop function if exists public.get_user_public_profile(uuid);
create or replace function public.get_user_public_profile(p_user_id uuid, p_today date default current_date)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile record;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id, name, avatar_color, avatar_url, created_at into v_profile
  from public.profiles where id = p_user_id;
  if not found then return null; end if;

  return json_build_object(
    'id',             v_profile.id,
    'name',           v_profile.name,
    'avatar_color',   v_profile.avatar_color,
    'avatar_url',     v_profile.avatar_url,
    'member_since',   v_profile.created_at,
    'total_checkins', (select count(*) from public.check_ins where user_id = p_user_id and deleted_at is null),
    'streak',         public.member_streak(p_user_id, null, p_today),
    'shared_groups',  coalesce((
      select json_agg(json_build_object(
        'id', gr.id, 'name', gr.name, 'color', gr.color,
        'streak', public.member_streak(p_user_id, gr.id, p_today)
      ))
      from public.group_members gm1
      join public.group_members gm2 on gm2.group_id = gm1.group_id
      join public.groups gr on gr.id = gm1.group_id
      where gm1.user_id = p_user_id and gm1.deleted_at is null
        and gm2.user_id = auth.uid() and gm2.deleted_at is null
        and gr.deleted_at is null
    ), '[]'::json)
  );
end;
$$;
revoke all on function public.get_user_public_profile(uuid, date) from public, anon;
grant execute on function public.get_user_public_profile(uuid, date) to authenticated;


-- ─── Create a crew with its color, size and visibility ───
drop function if exists public.create_my_group(text, text);
create or replace function public.create_my_group(
  p_name        text,
  p_invite_slug text,
  p_color       text    default 'mint',
  p_max_members int     default 15,
  p_is_public   boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Name is required';
  end if;
  if p_color not in ('mint','coral','sky','rose','grape','lemon','leaf','clay','indigo') then
    raise exception 'Unknown color';
  end if;
  if p_max_members not between 3 and 15 then
    raise exception 'Crews are 3 to 15 people';
  end if;

  insert into public.groups (name, invite_slug, created_by, color, max_members, is_public)
  values (left(trim(p_name), 32), upper(p_invite_slug), auth.uid(), p_color, p_max_members, p_is_public)
  returning id into v_group_id;

  insert into public.group_members (user_id, group_id)
  values (auth.uid(), v_group_id);

  return v_group_id;
end;
$$;
revoke all on function public.create_my_group(text, text, text, int, boolean) from public, anon;
grant execute on function public.create_my_group(text, text, text, int, boolean) to authenticated;


-- ─── Ask to join a public crew (also works again after a decline) ───
create or replace function public.request_to_join(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max   int;
  v_count int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select max_members into v_max
  from public.groups
  where id = p_group_id and deleted_at is null and is_public;
  if not found then
    raise exception 'Group not found';
  end if;

  if public.is_group_member(p_group_id) then
    return;
  end if;

  select count(*) into v_count
  from public.group_members where group_id = p_group_id and deleted_at is null;
  if v_count >= v_max then
    raise exception 'Group is full';
  end if;

  insert into public.join_requests (group_id, user_id)
  values (p_group_id, auth.uid())
  on conflict (group_id, user_id)
  do update set status = 'pending', created_at = now();
end;
$$;
revoke all on function public.request_to_join(uuid) from public, anon;
grant execute on function public.request_to_join(uuid) to authenticated;


-- ─── Check in: one call, all-or-nothing, once per crew per local day ───
-- p_tags: [{"name": "leg day", "color": "rose"}, ...]. New names become crew tags.
create or replace function public.create_check_in(
  p_group_id   uuid,
  p_local_date date,
  p_note       text  default null,
  p_tags       jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id     uuid;
  v_tag    jsonb;
  v_name   text;
  v_color  text;
  v_tag_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_group_member(p_group_id) then
    raise exception 'not authorized';
  end if;
  -- The client's local date can be a day either side of the server's (time zones).
  if p_local_date not between current_date - 1 and current_date + 1 then
    raise exception 'That date doesn’t look like today';
  end if;
  if exists (
    select 1 from public.check_ins
    where user_id = auth.uid() and group_id = p_group_id and local_date = p_local_date and deleted_at is null
  ) then
    raise exception 'You’re in for today';
  end if;

  insert into public.check_ins (user_id, group_id, local_date, note)
  values (auth.uid(), p_group_id, p_local_date, nullif(left(trim(coalesce(p_note, '')), 280), ''))
  returning id into v_id;

  for v_tag in select * from jsonb_array_elements(coalesce(p_tags, '[]'::jsonb)) loop
    v_name  := left(lower(trim(v_tag->>'name')), 24);
    v_color := v_tag->>'color';
    continue when coalesce(v_name, '') = '';
    if v_color not in ('coral','sky','rose','grape','lemon','leaf','clay','indigo') then
      v_color := 'coral';
    end if;

    select id into v_tag_id from public.tags
    where group_id = p_group_id and name = v_name and deleted_at is null;
    if v_tag_id is null then
      insert into public.tags (group_id, name, color) values (p_group_id, v_name, v_color)
      returning id into v_tag_id;
    end if;

    insert into public.check_in_tags (check_in_id, tag_id) values (v_id, v_tag_id)
    on conflict do nothing;
    update public.tags set usage_count = usage_count + 1 where id = v_tag_id;
    v_tag_id := null;
  end loop;

  return v_id;
end;
$$;
revoke all on function public.create_check_in(uuid, date, text, jsonb) from public, anon;
grant execute on function public.create_check_in(uuid, date, text, jsonb) to authenticated;


-- ─── Heart / unheart (soft) ───
create or replace function public.set_heart(p_check_in_id uuid, p_on boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  select group_id into v_group_id from public.check_ins where id = p_check_in_id and deleted_at is null;
  if v_group_id is null or not public.is_group_member(v_group_id) then
    raise exception 'not authorized';
  end if;

  if p_on then
    insert into public.reactions (check_in_id, user_id)
    values (p_check_in_id, auth.uid())
    on conflict (check_in_id, user_id)
    do update set deleted_at = null, created_at = now()
    where public.reactions.deleted_at is not null;
  else
    update public.reactions set deleted_at = now()
    where check_in_id = p_check_in_id and user_id = auth.uid() and deleted_at is null;
  end if;
  return p_on;
end;
$$;
revoke all on function public.set_heart(uuid, boolean) from public, anon;
grant execute on function public.set_heart(uuid, boolean) to authenticated;


-- ─── Realtime: the web app listens on these tables ───
do $$
declare
  t text;
begin
  foreach t in array array['check_ins', 'reactions', 'group_members', 'join_requests', 'tags', 'groups', 'profiles'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
