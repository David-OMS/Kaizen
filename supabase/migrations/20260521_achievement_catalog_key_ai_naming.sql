-- Stable catalog_key for triggers; title/description become AI-generated on unlock.

alter table public.achievements
  add column if not exists catalog_key text,
  add column if not exists naming_snapshot jsonb;

create unique index if not exists achievements_user_catalog_key_idx
  on public.achievements (user_id, catalog_key)
  where catalog_key is not null;
