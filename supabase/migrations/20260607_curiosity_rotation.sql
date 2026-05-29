-- Curiosity: auto-rotating book / country / profession study tracks

alter table public.profile add column if not exists curiosity_enabled boolean not null default true;
alter table public.profile add column if not exists curiosity_book_title text;
alter table public.profile add column if not exists curiosity_book_month text;
alter table public.profile add column if not exists curiosity_country text;
alter table public.profile add column if not exists curiosity_profession text;
alter table public.profile add column if not exists curiosity_week_start date;
alter table public.profile add column if not exists curiosity_week_wrap_up_done boolean not null default false;
alter table public.profile add column if not exists curiosity_starts_on date;
alter table public.profile add column if not exists curiosity_countries_done jsonb not null default '[]'::jsonb;
alter table public.profile add column if not exists curiosity_professions_done jsonb not null default '[]'::jsonb;
alter table public.profile add column if not exists curiosity_books_done jsonb not null default '[]'::jsonb;

alter table public.quests add column if not exists curiosity_track text;

alter table public.quests drop constraint if exists quests_source_type_check;
alter table public.quests
  add constraint quests_source_type_check check (
    source_type in ('task_pool', 'system_generated', 'ai_generated', 'curiosity')
  );

create index if not exists quests_curiosity_assigned_idx
  on public.quests (user_id, assigned_date)
  where source_type = 'curiosity';
