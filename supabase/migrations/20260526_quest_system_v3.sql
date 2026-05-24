-- Quest system v3: provision, budget, lifecycle, assessments

-- Profile
alter table public.profile add column if not exists quest_bandwidth text not null default 'normal';
alter table public.profile add column if not exists hunter_vision text;
alter table public.profile add column if not exists hunter_goals text;
alter table public.profile add column if not exists quest_timezone text not null default 'Africa/Lagos';
alter table public.profile add column if not exists last_daily_provision_at timestamptz;
alter table public.profile add column if not exists daily_budget_points_override integer;

alter table public.profile drop constraint if exists profile_quest_bandwidth_check;
alter table public.profile
  add constraint profile_quest_bandwidth_check check (quest_bandwidth in ('light', 'normal', 'push'));

update public.profile set quest_timezone = 'Africa/Lagos' where quest_timezone is null or quest_timezone = '';

-- Task pool
alter table public.task_pool add column if not exists mandatory boolean not null default false;
alter table public.task_pool add column if not exists priority text not null default 'normal';
alter table public.task_pool add column if not exists quest_kind text;
alter table public.task_pool add column if not exists last_outcome text;
alter table public.task_pool add column if not exists last_assigned_at timestamptz;
alter table public.task_pool add column if not exists drop_count integer not null default 0;

alter table public.task_pool drop constraint if exists task_pool_priority_check;
alter table public.task_pool
  add constraint task_pool_priority_check check (priority in ('normal', 'high'));

alter table public.task_pool drop constraint if exists task_pool_quest_kind_check;
alter table public.task_pool
  add constraint task_pool_quest_kind_check check (quest_kind is null or quest_kind in ('execution', 'learning'));

-- Quests lifecycle
alter table public.quests add column if not exists quest_kind text not null default 'execution';
alter table public.quests add column if not exists load_points integer not null default 2;
alter table public.quests add column if not exists started_at timestamptz;
alter table public.quests add column if not exists incomplete_reason text;
alter table public.quests add column if not exists incomplete_ai_verdict jsonb;
alter table public.quests add column if not exists extension_count integer not null default 0;
alter table public.quests add column if not exists grace_until timestamptz;
alter table public.quests add column if not exists assessment_status text not null default 'none';
alter table public.quests add column if not exists assessment_snapshot jsonb;
alter table public.quests add column if not exists carryover boolean not null default false;

alter table public.quests drop constraint if exists quests_quest_kind_check;
alter table public.quests
  add constraint quests_quest_kind_check check (quest_kind in ('execution', 'learning'));

alter table public.quests drop constraint if exists quests_assessment_status_check;
alter table public.quests
  add constraint quests_assessment_status_check
  check (assessment_status in ('none', 'pending', 'passed', 'failed'));

alter table public.quests drop constraint if exists quests_status_check;
alter table public.quests drop constraint if exists quests_source_type_check;

alter table public.quests
  add constraint quests_status_check check (
    status in ('active', 'incomplete', 'extended', 'assessment_pending', 'completed', 'failed', 'expired')
  );

alter table public.quests
  add constraint quests_source_type_check check (
    source_type in ('task_pool', 'system_generated', 'ai_generated')
  );

-- Quest log outcomes (append-only; widen check)
alter table public.quest_log drop constraint if exists quest_log_outcome_check;
alter table public.quest_log
  add constraint quest_log_outcome_check check (
    outcome in (
      'completed', 'failed', 'incomplete', 'expired', 'extended',
      'assessment_pass', 'assessment_fail'
    )
  );

-- Provision idempotency helper
create or replace function public.mark_daily_provision(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profile
  set last_daily_provision_at = now()
  where id = p_user_id;
end;
$$;
