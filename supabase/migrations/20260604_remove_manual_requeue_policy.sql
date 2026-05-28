-- Remove manual_requeue repeat policy entirely.

update public.task_pool
set repeat_policy = 'until_completed'
where repeat_policy = 'manual_requeue';

alter table public.task_pool drop constraint if exists task_pool_repeat_policy_check;
alter table public.task_pool
  add constraint task_pool_repeat_policy_check
  check (repeat_policy in ('until_completed', 'always'));

