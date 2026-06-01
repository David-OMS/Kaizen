-- Quest engine v4: AI task fields, battle intel, recall schedule, micro quests.

alter table public.task_pool
  add column if not exists inferred_horizon text,
  add column if not exists inferred_importance integer not null default 50,
  add column if not exists goal_alignment_score integer not null default 50,
  add column if not exists ai_confidence numeric(4, 2) not null default 0.5,
  add column if not exists ai_classified_at timestamptz;

alter table public.task_pool drop constraint if exists task_pool_inferred_horizon_check;
alter table public.task_pool
  add constraint task_pool_inferred_horizon_check
  check (inferred_horizon is null or inferred_horizon in ('one_off', 'long_track'));

alter table public.quests
  add column if not exists battle_intel text,
  add column if not exists battle_intel_at timestamptz,
  add column if not exists is_micro boolean not null default false,
  add column if not exists recall_source_quest_id uuid references public.quests(id) on delete set null,
  add column if not exists recall_kind text;

alter table public.quests drop constraint if exists quests_recall_kind_check;
alter table public.quests
  add constraint quests_recall_kind_check
  check (recall_kind is null or recall_kind in ('d1', 'd3', 'd7', 'surprise'));

create table if not exists public.quest_recall_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_quest_id uuid not null references public.quests(id) on delete cascade,
  source_title text not null default '',
  battle_intel text not null default '',
  due_date date not null,
  recall_kind text not null check (recall_kind in ('d1', 'd3', 'd7', 'surprise')),
  status text not null default 'pending' check (status in ('pending', 'assigned', 'done', 'skipped')),
  recall_quest_id uuid references public.quests(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists quest_recall_schedule_due_idx
  on public.quest_recall_schedule (user_id, due_date, status);

alter table public.quest_recall_schedule enable row level security;

drop policy if exists "quest_recall_schedule_owner" on public.quest_recall_schedule;
create policy "quest_recall_schedule_owner" on public.quest_recall_schedule
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on table public.quest_recall_schedule to authenticated;
grant select, insert, update, delete on table public.quest_recall_schedule to service_role;
