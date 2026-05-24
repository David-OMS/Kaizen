-- Align clients.status check with phase2 UI (pending | ongoing | completed | failed).
-- Run if convert/create raid fails: clients_status_check (e.g. app sent 'active' but DB expects 'ongoing').

alter table public.clients drop constraint if exists clients_status_check;

update public.clients
set status = case status
  when 'active' then 'ongoing'
  when 'lost' then 'completed'
  when 'proposal' then 'pending'
  else status
end;

alter table public.clients
add constraint clients_status_check
check (status in ('pending', 'ongoing', 'completed', 'failed'));
