-- Remove ambiguous "both" task type; weekly_eligible now covers dual-mode behavior.

update public.task_pool
set type = 'weekly_eligible'
where type = 'both';

alter table public.task_pool drop constraint if exists task_pool_type_check;
alter table public.task_pool
  add constraint task_pool_type_check
  check (type in ('daily_eligible', 'weekly_eligible'));

