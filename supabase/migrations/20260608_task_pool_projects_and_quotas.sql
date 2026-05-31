-- Multi-day AI-phased projects + weekly execution quotas on task pool.

alter table public.task_pool
  add column if not exists project_phases jsonb not null default '[]'::jsonb,
  add column if not exists current_phase_index integer not null default 0,
  add column if not exists weekly_quota_target integer,
  add column if not exists weekly_quota_progress integer not null default 0,
  add column if not exists weekly_quota_week_start date;

alter table public.task_pool drop constraint if exists task_pool_weekly_quota_target_check;
alter table public.task_pool
  add constraint task_pool_weekly_quota_target_check
  check (weekly_quota_target is null or (weekly_quota_target between 1 and 14));

alter table public.task_pool drop constraint if exists task_pool_inferred_horizon_check;
alter table public.task_pool
  add constraint task_pool_inferred_horizon_check
  check (
    inferred_horizon is null
    or inferred_horizon in ('one_off', 'long_track', 'multi_day', 'weekly_quota')
  );
