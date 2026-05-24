-- Phase 8: reconcile profile XP caches from xp_log (source of truth).
-- Safe to re-run (idempotent totals).

update public.profile p
set
  xp = coalesce(s.total, 0),
  total_xp = coalesce(s.total, 0)
from (
  select user_id, sum(amount)::integer as total
  from public.xp_log
  group by user_id
) s
where p.id = s.user_id;

update public.profile p
set xp = 0, total_xp = 0
where not exists (select 1 from public.xp_log x where x.user_id = p.id);

-- quest_log append-only (replace legacy separate update/delete triggers if present)
create or replace function public.prevent_quest_log_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'quest_log is append-only';
end;