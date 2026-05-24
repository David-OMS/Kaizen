-- Hunt outcome notes + raid battles (start / deliver / retreat / spoil claim).

alter table public.reachouts
  add column if not exists outcome_notes text;

create table if not exists public.raid_battles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  battle_name text not null,
  scope_note text not null default '',
  status text not null default 'in_progress'
    check (status in ('in_progress', 'awaiting_spoil', 'spoils_claimed', 'retreated')),
  started_at date not null default current_date,
  due_date date,
  delivered_at timestamptz,
  retreated_at timestamptz,
  retreat_note text,
  client_directive text,
  retreat_xp integer check (retreat_xp is null or (retreat_xp >= 0 and retreat_xp <= 500)),
  retreat_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists raid_battles_client_idx
  on public.raid_battles (client_id, started_at desc);

alter table public.raid_spoils
  add column if not exists battle_id uuid references public.raid_battles(id) on delete set null;

drop trigger if exists raid_battles_touch_updated_at on public.raid_battles;
create trigger raid_battles_touch_updated_at
before update on public.raid_battles
for each row execute function public.touch_updated_at();

alter table public.raid_battles enable row level security;

drop policy if exists "raid_battles_owner" on public.raid_battles;
create policy "raid_battles_owner" on public.raid_battles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on table public.raid_battles to authenticated;
