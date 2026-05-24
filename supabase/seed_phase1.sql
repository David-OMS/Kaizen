-- Optional phase 1 seed.
-- Run after signup if you want starter skills and a custom display name.
-- Replace USER_ID with your auth.users.id.

insert into public.profile (
  id,
  username,
  name,
  title,
  rank,
  level,
  xp,
  capacity_slots_total,
  founding_date,
  streak_current,
  streak_best
)
values (
  'USER_ID',
  'your_username',
  'Your Founder Name',
  'Registered Entity',
  'E',
  1,
  0,
  3,
  current_date,
  0,
  0
)
on conflict (id) do update set
  username = excluded.username,
  name = excluded.name,
  title = excluded.title;

insert into public.skills (user_id, name, description, unlocked)
values
  ('USER_ID', 'Negotiation', 'Drive higher-value contracts with structured offers.', true),
  ('USER_ID', 'Outbound Precision', 'Convert cold reachouts into qualified calls.', true),
  ('USER_ID', 'Authority Positioning', 'Publish insights that attract inbound demand.', false),
  ('USER_ID', 'Delegation', 'Build systems and handoffs to remove founder bottlenecks.', false)
on conflict do nothing;
