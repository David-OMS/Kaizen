-- Raid-linked exam collection: one active period per raid, append-only amounts (no schools, no payment dates).

create table if not exists public.treasury_collection_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null default '',
  start_month integer not null check (start_month between 1 and 12),
  start_year integer not null check (start_year >= 2000 and start_year <= 2100),
  end_month integer check (end_month is null or (end_month between 1 and 12)),
  end_year integer check (end_year is null or (end_year >= 2000 and end_year <= 2100)),
  status text not null default 'active' check (status in ('active', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (end_month is null and end_year is null)
    or (end_month is not null and end_year is not null)
  )
);

create table if not exists public.treasury_collection_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_id uuid not null references public.treasury_collection_periods(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  note text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists treasury_collection_one_active_per_raid
  on public.treasury_collection_periods (client_id)
  where (status = 'active');

create index if not exists treasury_collection_periods_raid_idx
  on public.treasury_collection_periods (client_id, status, start_year desc, start_month desc);

create index if not exists treasury_collection_entries_period_idx
  on public.treasury_collection_entries (period_id, created_at desc);

drop trigger if exists treasury_collection_periods_touch_updated_at on public.treasury_collection_periods;
create trigger treasury_collection_periods_touch_updated_at
before update on public.treasury_collection_periods
for each row execute function public.touch_updated_at();

alter table public.treasury_collection_periods enable row level security;
alter table public.treasury_collection_entries enable row level security;

drop policy if exists "treasury_collection_periods_owner" on public.treasury_collection_periods;
create policy "treasury_collection_periods_owner" on public.treasury_collection_periods
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "treasury_collection_entries_owner" on public.treasury_collection_entries;
create policy "treasury_collection_entries_owner" on public.treasury_collection_entries
for insert with check (auth.uid() = user_id);

drop policy if exists "treasury_collection_entries_select" on public.treasury_collection_entries;
create policy "treasury_collection_entries_select" on public.treasury_collection_entries
for select using (auth.uid() = user_id);

grant select, insert, update on table public.treasury_collection_periods to authenticated;
grant select, insert on table public.treasury_collection_entries to authenticated;
