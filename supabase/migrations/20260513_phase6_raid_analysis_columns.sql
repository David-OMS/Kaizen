-- Phase 6: persist Raid Analyzer output on clients (quests already have analysis_snapshot).

alter table public.clients add column if not exists difficulty_score integer;

alter table public.clients add column if not exists analysis_snapshot jsonb;

update public.clients
set difficulty_score = greatest(0, least(100, difficulty_score))
where difficulty_score is not null and (difficulty_score < 0 or difficulty_score > 100);

alter table public.clients drop constraint if exists clients_difficulty_score_check;

alter table public.clients
add constraint clients_difficulty_score_check
check (difficulty_score is null or (difficulty_score >= 0 and difficulty_score <= 100));
