-- Attempt-fail: tried but could not achieve (distinct from incomplete extension)

alter table public.quests add column if not exists attempt_fail_reason text;
alter table public.quests add column if not exists attempt_fail_verdict jsonb;
