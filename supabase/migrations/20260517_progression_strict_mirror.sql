-- Stricter level curve + C gate (3 raids) + rank cap default D until B income logic ships.

alter table public.profile
add column if not exists rank_cap text check (rank_cap is null or rank_cap in ('E', 'D', 'C', 'B', 'A', 'S'));

-- Honesty cap: display/persisted rank cannot exceed D until cleared (set null when B gates pass).
update public.profile set rank_cap = 'D' where rank_cap is null;

alter table public.profile alter column rank_cap set default 'D';
