-- clients.raid_rank used by Field UI + achievement rank milestones

alter table public.clients
  add column if not exists raid_rank text not null default 'E';

alter table public.clients drop constraint if exists clients_raid_rank_check;

alter table public.clients
  add constraint clients_raid_rank_check
  check (raid_rank in ('E', 'D', 'C', 'B', 'A', 'S'));
