-- Phase 4: optional quest → skill mapping (Core Engine V2).
alter table public.quests add column if not exists primary_skill_id uuid references public.skills(id) on delete set null;
alter table public.quests add column if not exists secondary_skill_id uuid references public.skills(id) on delete set null;
