-- Raid spoils: one-off payments + recurring streams + monthly accruals (calendar month, Africa/Lagos).

create table if not exists public.raid_spoils (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  work_note text not null default '',
  ritual_name text not null,
  ritual_tagline text not null default '',
  naming_snapshot jsonb,
  battle_xp integer not null default 0 check (battle_xp >= 0 and battle_xp <= 5000),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.raid_recurring_streams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  purpose_user_text text not null default '',
  ritual_name text not null,
  ritual_tagline text not null default '',
  naming_snapshot jsonb,
  first_period_year integer not null check (first_period_year >= 2000 and first_period_year <= 2100),
  first_period_month integer not null check (first_period_month between 1 and 12),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.raid_recurring_accruals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stream_id uuid not null references public.raid_recurring_streams(id) on delete cascade,
  period_year integer not null check (period_year >= 2000 and period_year <= 2100),
  period_month integer not null check (period_month between 1 and 12),
  amount numeric(12, 2) not null check (amount >= 0),
  ready_at timestamptz not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (stream_id, period_year, period_month)
);

create index if not exists raid_spoils_client_idx on public.raid_spoils (client_id, created_at desc);
create index if not exists raid_recurring_streams_client_idx on public.raid_recurring_streams (client_id);
create index if not exists raid_recurring_accruals_stream_idx on public.raid_recurring_accruals (stream_id, period_year desc, period_month desc);

drop trigger if exists raid_recurring_streams_touch_updated_at on public.raid_recurring_streams;
create trigger raid_recurring_streams_touch_updated_at
before update on public.raid_recurring_streams
for each row execute function public.touch_updated_at();

alter table public.raid_spoils enable row level security;
alter table public.raid_recurring_streams enable row level security;
alter table public.raid_recurring_accruals enable row level security;

drop policy if exists "raid_spoils_owner" on public.raid_spoils;
create policy "raid_spoils_owner" on public.raid_spoils
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "raid_recurring_streams_owner" on public.raid_recurring_streams;
create policy "raid_recurring_streams_owner" on public.raid_recurring_streams
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "raid_recurring_accruals_owner" on public.raid_recurring_accruals;
create policy "raid_recurring_accruals_owner" on public.raid_recurring_accruals
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on table public.raid_spoils to authenticated;
grant select, insert, update, delete on table public.raid_recurring_streams to authenticated;
grant select, insert, update, delete on table public.raid_recurring_accruals to authenticated;
