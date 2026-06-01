-- One random brain-teaser fact per calendar day (profile TZ); history prevents repeats.

alter table public.profile
  add column if not exists daily_brain_teaser_fact text,
  add column if not exists daily_brain_teaser_date date,
  add column if not exists brain_teaser_facts_seen jsonb not null default '[]'::jsonb;
