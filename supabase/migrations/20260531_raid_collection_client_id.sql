-- If 20260530 ran without client_id, attach periods to raids.

alter table public.treasury_collection_periods
  add column if not exists client_id uuid references public.clients(id) on delete cascade;

drop index if exists public.treasury_collection_one_active_per_user;
drop index if exists public.treasury_collection_one_active_per_raid;

create unique index if not exists treasury_collection_one_active_per_raid
  on public.treasury_collection_periods (client_id)
  where (status = 'active');

create index if not exists treasury_collection_periods_raid_idx
  on public.treasury_collection_periods (client_id, status, start_year desc, start_month desc);
