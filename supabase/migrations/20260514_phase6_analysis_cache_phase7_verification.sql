-- Phase 6: server-side AI analysis cache (24h reuse by content hash).
-- Phase 7: skill arc verification grades (insert from Edge with service role only).

create table if not exists public.ai_analysis_cache (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('quest', 'raid')),
  content_hash text not null,
  payload jsonb not null,
  model text not null,
  fallback_used boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, content_hash)
);

create index if not exists ai_analysis_cache_created_at_idx on public.ai_analysis_cache (created_at);

alter table public.ai_analysis_cache enable row level security;

drop policy if exists "ai_analysis_cache_select_own" on public.ai_analysis_cache;
create policy "ai_analysis_cache_select_own" on public.ai_analysis_cache for select using (auth.uid() = user_id);

drop policy if exists "ai_analysis_cache_insert_own" on public.ai_analysis_cache;
create policy "ai_analysis_cache_insert_own" on public.ai_analysis_cache for insert with check (auth.uid() = user_id);

drop policy if exists "ai_analysis_cache_update_own" on public.ai_analysis_cache;
create policy "ai_analysis_cache_update_own" on public.ai_analysis_cache for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ai_analysis_cache_delete_own" on public.ai_analysis_cache;
create policy "ai_analysis_cache_delete_own" on public.ai_analysis_cache for delete using (auth.uid() = user_id);

grant select, insert, update, delete on table public.ai_analysis_cache to authenticated;

-- Verification grades: users read own rows; inserts only via Edge Function (service role).
create table if not exists public.skill_verification_grades (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  arc_id uuid not null references public.skill_arcs (id) on delete cascade,
  score integer not null check (score between 0 and 100),
  passed boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists skill_verification_grades_arc_idx on public.skill_verification_grades (arc_id, created_at desc);

alter table public.skill_verification_grades enable row level security;

drop policy if exists "skill_verification_grades_select_own" on public.skill_verification_grades;
create policy "skill_verification_grades_select_own" on public.skill_verification_grades for select using (auth.uid() = user_id);

grant select on table public.skill_verification_grades to authenticated;
