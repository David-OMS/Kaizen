-- Edge functions (provision-daily-quests, etc.) use the service_role JWT.
-- RLS is bypassed for service_role, but table-level GRANTs are still required.
-- Run this if you see: 42501 permission denied for table quests

grant usage on schema public to service_role;

grant select, insert, update, delete on table public.quests to service_role;
grant select, insert on table public.quest_log to service_role;
grant select, insert, update, delete on table public.task_pool to service_role;
grant select, insert, update on table public.profile to service_role;
grant select, insert on table public.xp_log to service_role;
grant select, insert, update, delete on table public.quest_recall_schedule to service_role;

grant execute on function public.mark_daily_provision(uuid) to service_role;
