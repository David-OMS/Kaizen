-- Weekly focus capacity: users choose active long-term tracks within realistic simultaneous limit.

alter table public.task_pool
  add column if not exists focus_active boolean not null default true;

