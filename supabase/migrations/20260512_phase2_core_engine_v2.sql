-- Phase 2: Core Engine V2 data model (existing databases).
-- Run once in Supabase SQL editor. Greenfield installs use updated schema.sql instead.

-- -----------------------------------------------------------------------------
-- Profile: total_xp cache (mirrors xp; xp_log remains source of truth via add_xp)
-- -----------------------------------------------------------------------------
alter table public.profile add column if not exists total_xp integer;

update public.profile set total_xp = coalesce(xp, 0) where total_xp is null;

alter table public.profile alter column total_xp set default 0;

alter table public.profile alter column total_xp set not null;

-- -----------------------------------------------------------------------------
-- Raids (clients): canonical statuses pending | ongoing | completed | failed
-- -----------------------------------------------------------------------------
alter table public.clients drop constraint if exists clients_status_check;

update public.clients
set status = case status
  when 'active' then 'ongoing'
  when 'lost' then 'completed'
  when 'proposal' then 'pending'
  else status
end;

alter table public.clients
add constraint clients_status_check
check (status in ('pending', 'ongoing', 'completed', 'failed'));

-- -----------------------------------------------------------------------------
-- Quests: analyzer + formula inputs
-- -----------------------------------------------------------------------------
alter table public.quests add column if not exists difficulty text;
alter table public.quests add column if not exists fear_level integer;
alter table public.quests add column if not exists source_type text;
alter table public.quests add column if not exists reward_visibility text;
alter table public.quests add column if not exists accepted boolean;
alter table public.quests add column if not exists analysis_snapshot jsonb;

update public.quests set difficulty = coalesce(difficulty, 'medium');
update public.quests set fear_level = coalesce(fear_level, 2);
update public.quests set source_type = coalesce(source_type, 'task_pool');
update public.quests set reward_visibility = coalesce(reward_visibility, 'known');
update public.quests set accepted = coalesce(accepted, true);

alter table public.quests alter column difficulty set not null;
alter table public.quests alter column difficulty set default 'medium';

alter table public.quests alter column fear_level set not null;
alter table public.quests alter column fear_level set default 2;

alter table public.quests alter column source_type set not null;
alter table public.quests alter column source_type set default 'task_pool';

alter table public.quests alter column reward_visibility set not null;
alter table public.quests alter column reward_visibility set default 'known';

alter table public.quests alter column accepted set not null;
alter table public.quests alter column accepted set default true;

alter table public.quests drop constraint if exists quests_difficulty_check;
alter table public.quests
add constraint quests_difficulty_check check (difficulty in ('easy', 'medium', 'hard', 'legendary'));

alter table public.quests drop constraint if exists quests_fear_level_check;
alter table public.quests
add constraint quests_fear_level_check check (fear_level between 1 and 5);

alter table public.quests drop constraint if exists quests_source_type_check;
alter table public.quests
add constraint quests_source_type_check check (source_type in ('task_pool', 'system_generated'));

alter table public.quests drop constraint if exists quests_reward_visibility_check;
alter table public.quests
add constraint quests_reward_visibility_check check (reward_visibility in ('known', 'unknown'));

-- -----------------------------------------------------------------------------
-- Hunts (reachouts): fear + AI snapshot
-- -----------------------------------------------------------------------------
alter table public.reachouts add column if not exists fear_level integer;
alter table public.reachouts add column if not exists analysis_snapshot jsonb;

update public.reachouts set fear_level = coalesce(fear_level, 3);

alter table public.reachouts alter column fear_level set not null;
alter table public.reachouts alter column fear_level set default 3;

alter table public.reachouts drop constraint if exists reachouts_fear_level_check;
alter table public.reachouts
add constraint reachouts_fear_level_check check (fear_level between 1 and 5);

-- -----------------------------------------------------------------------------
-- Skills: two-layer model + curriculum
-- -----------------------------------------------------------------------------
alter table public.skills add column if not exists skill_type text;
alter table public.skills add column if not exists xp integer;
alter table public.skills add column if not exists level integer;
alter table public.skills add column if not exists curriculum_tier text;
alter table public.skills add column if not exists active boolean;

update public.skills set skill_type = coalesce(skill_type, 'core');
update public.skills set xp = coalesce(xp, 0);
update public.skills set level = coalesce(level, 0);
update public.skills set active = coalesce(active, true);

alter table public.skills alter column skill_type set not null;
alter table public.skills alter column skill_type set default 'core';

alter table public.skills alter column xp set not null;
alter table public.skills alter column xp set default 0;

alter table public.skills alter column level set not null;
alter table public.skills alter column level set default 0;

alter table public.skills alter column active set not null;
alter table public.skills alter column active set default true;

alter table public.skills drop constraint if exists skills_skill_type_check;
alter table public.skills
add constraint skills_skill_type_check check (skill_type in ('core', 'domain'));

alter table public.skills drop constraint if exists skills_curriculum_tier_check;
alter table public.skills
add constraint skills_curriculum_tier_check
check (curriculum_tier is null or curriculum_tier in ('foundation', 'applied', 'operational'));

-- -----------------------------------------------------------------------------
-- Skill milestones + arcs (Phase 4 logic consumes these)
-- -----------------------------------------------------------------------------
create table if not exists public.skill_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  tier text not null check (tier in ('foundation', 'applied', 'operational')),
  title text not null,
  completed boolean not null default false,
  verified boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.skill_arcs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  status text not null default 'proposed'
    check (status in ('proposed', 'accepted', 'active', 'verification', 'unlocked', 'paused')),
  proposed_skill_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists skill_arcs_touch_updated_at on public.skill_arcs;
create trigger skill_arcs_touch_updated_at
before update on public.skill_arcs
for each row execute function public.touch_updated_at();

alter table public.skill_milestones enable row level security;
alter table public.skill_arcs enable row level security;

drop policy if exists "skill_milestones_owner" on public.skill_milestones;
create policy "skill_milestones_owner" on public.skill_milestones
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "skill_arcs_owner" on public.skill_arcs;
create policy "skill_arcs_owner" on public.skill_arcs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on table public.skill_milestones to authenticated;
grant select, insert, update, delete on table public.skill_arcs to authenticated;

drop trigger if exists skill_arcs_touch_updated_at on public.skill_arcs;
create trigger skill_arcs_touch_updated_at
before update on public.skill_arcs
for each row
execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- RPC: keep xp + total_xp in sync
-- -----------------------------------------------------------------------------
create or replace function public.add_xp(p_amount integer, p_event_type text, p_description text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_total_xp integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  insert into public.xp_log (user_id, event_type, description, amount)
  values (v_user_id, p_event_type, p_description, p_amount);

  select coalesce(sum(amount), 0) into v_total_xp
  from public.xp_log
  where user_id = v_user_id;

  update public.profile
  set xp = v_total_xp,
      total_xp = v_total_xp
  where id = v_user_id;

  return v_total_xp;
end;
$$;

create or replace function public.reconcile_profile_xp()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_total_xp integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  select coalesce(sum(amount), 0) into v_total_xp
  from public.xp_log
  where user_id = v_user_id;

  update public.profile
  set xp = v_total_xp,
      total_xp = v_total_xp
  where id = v_user_id;

  return v_total_xp;
end;
$$;
