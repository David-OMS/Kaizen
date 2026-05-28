-- Task pool repeat policy + weekly day distribution settings.

alter table public.task_pool
  add column if not exists repeat_policy text not null default 'until_completed',
  add column if not exists weekly_target_days integer,
  add column if not exists weekly_distribution_mode text not null default 'adaptive';

alter table public.task_pool drop constraint if exists task_pool_repeat_policy_check;
alter table public.task_pool
  add constraint task_pool_repeat_policy_check
  check (repeat_policy in ('until_completed', 'always', 'manual_requeue'));

alter table public.task_pool drop constraint if exists task_pool_weekly_target_days_check;
alter table public.task_pool
  add constraint task_pool_weekly_target_days_check
  check (weekly_target_days is null or (weekly_target_days between 1 and 7));

alter table public.task_pool drop constraint if exists task_pool_weekly_distribution_mode_check;
alter table public.task_pool
  add constraint task_pool_weekly_distribution_mode_check
  check (weekly_distribution_mode in ('spread', 'consecutive', 'adaptive'));
