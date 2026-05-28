-- Sapien: integration level (1–5) replaces manual XP; per-habit streaks + milestone rewards

alter table public.sapien_habits
  add column if not exists integration_level smallint not null default 3
    check (integration_level between 1 and 5);

alter table public.sapien_habits
  add column if not exists streak_current integer not null default 0 check (streak_current >= 0);

alter table public.sapien_habits
  add column if not exists streak_best integer not null default 0 check (streak_best >= 0);

update public.sapien_habits
set integration_level = case
  when xp_per_claim >= 18 then 5
  when xp_per_claim >= 14 then 4
  when xp_per_claim >= 10 then 3
  when xp_per_claim >= 7 then 2
  else 1
end
where integration_level = 3 and xp_per_claim is distinct from 10;

create table if not exists public.sapien_habit_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.sapien_habits(id) on delete cascade,
  milestone_days integer not null check (milestone_days > 0),
  display_title text not null,
  display_tagline text,
  xp_bonus integer not null check (xp_bonus >= 0),
  naming_snapshot jsonb,
  unlocked_at timestamptz not null default now(),
  unique (habit_id, milestone_days)
);

create index if not exists sapien_habit_rewards_user_idx
  on public.sapien_habit_rewards (user_id, unlocked_at desc);

alter table public.sapien_habit_rewards enable row level security;

create policy sapien_habit_rewards_owner on public.sapien_habit_rewards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert on public.sapien_habit_rewards to authenticated;
grant select, insert, delete on public.sapien_habit_rewards to service_role;
