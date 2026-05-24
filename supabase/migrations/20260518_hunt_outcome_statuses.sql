-- Hunt outcomes: game-facing statuses (replaces no_reply / interested / rejected / ghosted).

alter table public.reachouts drop constraint if exists reachouts_response_status_check;

update public.reachouts set response_status = 'active' where response_status = 'no_reply';
update public.reachouts set response_status = 'engaged' where response_status = 'interested';
update public.reachouts set response_status = 'declined' where response_status = 'rejected';
update public.reachouts set response_status = 'cold' where response_status = 'ghosted';

alter table public.reachouts
add constraint reachouts_response_status_check
check (response_status in ('active', 'engaged', 'declined', 'cold'));

alter table public.reachouts alter column response_status set default 'active';
