-- Skill catalog keys + push subscriptions

alter table public.skills add column if not exists catalog_key text;

create unique index if not exists skills_user_catalog_key_idx
  on public.skills (user_id, catalog_key)
  where catalog_key is not null;

update public.skills set skill_type = 'specialty' where skill_type = 'domain';
update public.skills set skill_type = 'builder' where skill_type = 'core';

alter table public.skills drop constraint if exists skills_skill_type_check;
alter table public.skills
  add constraint skills_skill_type_check
  check (skill_type in ('builder', 'founder', 'specialty'));

-- Push subscriptions (one row per user — latest device)
create table if not exists public.push_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_owner on public.push_subscriptions;
create policy push_subscriptions_owner on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on table public.push_subscriptions to authenticated;
grant select, insert, update, delete on table public.push_subscriptions to service_role;
