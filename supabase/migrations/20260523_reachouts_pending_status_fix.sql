-- Fix hunt register: allow pending + final outcomes (run if hunts fail with reachouts_response_status_check).

alter table public.reachouts drop constraint if exists reachouts_response_status_check;

update public.reachouts set response_status = 'pending'
where response_status in ('no_reply', 'active');

update public.reachouts set response_status = 'successful'
where response_status in ('interested', 'engaged');

update public.reachouts set response_status = 'rejected'
where response_status in ('declined', 'rejected');

update public.reachouts set response_status = 'ghosted'
where response_status in ('ghosted', 'cold');

alter table public.reachouts
add constraint reachouts_response_status_check
check (response_status in ('pending', 'successful', 'rejected', 'ghosted'));

alter table public.reachouts alter column response_status set default 'pending';
