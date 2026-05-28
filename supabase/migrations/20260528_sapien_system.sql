-- Sapien mode: personal habits, separate XP track from Hunter

alter table public.profile add column if not exists sapien_xp integer not null default 0;
alter table public.profile add column if not exists sapien_level integer not null default 1;
alter table public.profile add column if not exists sapien_rank text not null default 'Mortal';

create table if not exists public.sapien_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  xp_per_claim integer not null default 10 check (xp_per_claim > 0),
  habit_kind text not null default 'once' check (habit_kind in ('once', 'count')),
  target_count integer not null default 1 check (target_count >= 1),
  schedule_days smallint[] not null default '{0,1,2,3,4,5,6}',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sapien_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.sapien_habits(id) on delete cascade,
  claim_date date not null default (current_date),
  claim_index integer not null default 1 check (claim_index >= 1),
  xp_amount integer not null,
  claimed_at timestamptz not null default now(),
  unique (habit_id, claim_date, claim_index)
);

create index if not exists sapien_claims_user_date_idx
  on public.sapien_claims (user_id, claim_date);

alter table public.sapien_habits enable row level security;
alter table public.sapien_claims enable row level security;

create policy sapien_habits_owner on public.sapien_habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy sapien_claims_select on public.sapien_claims
  for select using (auth.uid() = user_id);

create policy sapien_claims_insert on public.sapien_claims
  for insert with check (auth.uid() = user_id);

grant select, insert, update, delete on public.sapien_habits to authenticated;
grant select, insert on public.sapien_claims to authenticated;
grant select, insert, update, delete on public.sapien_habits to service_role;
grant select, insert on public.sapien_claims to service_role;

-- Hunter profile XP excludes sapien_* events
create or replace function public.add_xp(p_amount integer, p_event_type text, p_description text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_total_xp integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  insert into public.xp_log (user_id, event_type, description, amount)
  values (v_user_id, p_event_type, p_description, p_amount);

  select coalesce(sum(amount), 0) into v_total_xp
  from public.xp_log
  where user_id = v_user_id
    and event_type not like 'sapien_%';

  update public.profile
  set xp = v_total_xp,
      total_xp = v_total_xp
  where id = v_user_id;

  return v_total_xp;
end;
$$;

create or replace function public.add_sapien_xp(p_amount integer, p_event_type text, p_description text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_sapien_xp integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  if p_event_type not like 'sapien_%' then
    raise exception 'Sapien XP requires sapien_* event_type.';
  end if;

  insert into public.xp_log (user_id, event_type, description, amount)
  values (v_user_id, p_event_type, p_description, p_amount);

  select coalesce(sum(amount), 0) into v_sapien_xp
  from public.xp_log
  where user_id = v_user_id
    and event_type like 'sapien_%';

  update public.profile
  set sapien_xp = v_sapien_xp
  where id = v_user_id;

  return v_sapien_xp;
end;
$$;

grant execute on function public.add_sapien_xp(integer, text, text) to authenticated;
