-- OMS Solo Levelling schema
-- Apply in Supabase SQL editor after creating project.

create extension if not exists "pgcrypto";

create table if not exists public.profile (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  name text not null,
  title text not null default 'Registered Entity',
  rank text not null default 'E',
  level integer not null default 1,
  xp integer not null default 0,
  capacity_slots_total integer not null default 3,
  founding_date date not null default now(),
  streak_current integer not null default 0,
  streak_best integer not null default 0,
  revenue_target_monthly numeric(12, 2) not null default 0,
  rank_cap text default 'D' check (rank_cap is null or rank_cap in ('E', 'D', 'C', 'B', 'A', 'S')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile
add column if not exists username text;

alter table public.profile
add column if not exists rank_cap text default 'D' check (rank_cap is null or rank_cap in ('E', 'D', 'C', 'B', 'A', 'S'));

create unique index if not exists profile_username_unique
on public.profile (lower(username))
where username is not null;

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  unlocked boolean not null default false,
  unlocked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  project_name text,
  status text not null check (status in ('pending', 'ongoing', 'completed', 'failed')),
  start_date date,
  contract_value numeric(12, 2),
  referral_source text,
  notes text,
  raid_rank text not null default 'E' check (raid_rank in ('E', 'D', 'C', 'B', 'A', 'S')),
  created_at timestamptz not null default now()
);

create table if not exists public.reachouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_name text not null,
  company text,
  channel text,
  date_sent date not null default now(),
  fear_level integer not null default 3 check (fear_level between 1 and 5),
  response_status text not null default 'pending' check (response_status in ('pending', 'successful', 'rejected', 'ghosted')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.treasury_income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  amount numeric(12, 2) not null,
  expected_date date,
  received_date date,
  status text not null check (status in ('expected', 'received', 'overdue')),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.treasury_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  amount numeric(12, 2) not null,
  date date not null default now(),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.task_pool (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  context_note text,
  type text not null check (type in ('daily_eligible', 'weekly_eligible', 'both')),
  linked_client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now(),
  times_assigned integer not null default 0
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_pool_id uuid references public.task_pool(id) on delete set null,
  title text not null,
  period text not null check (period in ('daily', 'weekly')),
  assigned_date date not null default now(),
  due_date date not null,
  status text not null check (status in ('active', 'completed', 'failed')),
  xp_reward integer not null default 0,
  xp_penalty integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.quest_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid references public.quests(id) on delete set null,
  title text not null,
  period text not null check (period in ('daily', 'weekly')),
  outcome text not null check (outcome in ('completed', 'failed')),
  xp_delta integer not null,
  logged_at timestamptz not null default now()
);

create table if not exists public.xp_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  description text not null,
  amount integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  company text,
  role text,
  warmth text not null check (warmth in ('cold', 'warm', 'hot')),
  last_interaction_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_key text,
  title text not null,
  description text not null default '',
  xp_reward integer not null default 0,
  unlocked boolean not null default false,
  unlocked_at timestamptz,
  manually_awarded boolean not null default false,
  manual_date_override date,
  naming_snapshot jsonb
);

create table if not exists public.locked_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('feature', 'market', 'skill', 'client_type')),
  title text not null,
  description text not null default '',
  unlocked boolean not null default false,
  unlocked_at timestamptz
);

create table if not exists public.intel_board (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('idea', 'research', 'opportunity')),
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null check (year >= 2024),
  content text not null,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profile_touch_updated_at on public.profile;
create trigger profile_touch_updated_at
before update on public.profile
for each row
execute function public.touch_updated_at();

create or replace function public.prevent_quest_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'quest_log is append-only.';
end;
$$;

drop trigger if exists quest_log_prevent_update on public.quest_log;
create trigger quest_log_prevent_update
before update on public.quest_log
for each row
execute function public.prevent_quest_log_mutation();

drop trigger if exists quest_log_prevent_delete on public.quest_log;
create trigger quest_log_prevent_delete
before delete on public.quest_log
for each row
execute function public.prevent_quest_log_mutation();

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
  where user_id = v_user_id;

  update public.profile
  set xp = v_total_xp
  where id = v_user_id;

  return v_total_xp;
end;
$$;

create or replace function public.reconcile_profile_xp()
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

  select coalesce(sum(amount), 0) into v_total_xp
  from public.xp_log
  where user_id = v_user_id;

  update public.profile set xp = v_total_xp where id = v_user_id;

  return v_total_xp;
end;
$$;

create or replace function public.get_sign_in_email(p_username text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  select au.email into v_email
  from public.profile p
  join auth.users au on au.id = p.id
  where lower(p.username) = lower(trim(p_username))
  limit 1;

  return v_email;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text := lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  v_display_name text := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'Hunter');
begin
  insert into public.profile (id, username, name)
  values (new.id, v_username, v_display_name)
  on conflict (id) do update set
    username = excluded.username,
    name = excluded.name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profile enable row level security;
alter table public.skills enable row level security;
alter table public.clients enable row level security;
alter table public.reachouts enable row level security;
alter table public.treasury_income enable row level security;
alter table public.treasury_expenses enable row level security;
alter table public.task_pool enable row level security;
alter table public.quests enable row level security;
alter table public.quest_log enable row level security;
alter table public.xp_log enable row level security;
alter table public.contacts enable row level security;
alter table public.achievements enable row level security;
alter table public.locked_content enable row level security;
alter table public.intel_board enable row level security;
alter table public.monthly_reviews enable row level security;

drop policy if exists "profile_owner" on public.profile;
create policy "profile_owner" on public.profile
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "skills_owner" on public.skills
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "clients_owner" on public.clients
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reachouts_owner" on public.reachouts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "treasury_income_owner" on public.treasury_income
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "treasury_expenses_owner" on public.treasury_expenses
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "task_pool_owner" on public.task_pool
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "quests_owner" on public.quests
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "quest_log_owner" on public.quest_log
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "xp_log_owner" on public.xp_log
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "contacts_owner" on public.contacts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "achievements_owner" on public.achievements
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "locked_content_owner" on public.locked_content
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "intel_board_owner" on public.intel_board
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "monthly_reviews_owner" on public.monthly_reviews
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
