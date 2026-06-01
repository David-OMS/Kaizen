-- =============================================================================
-- DAILY QUESTS @ 05:00 Lagos — do these steps in order (Supabase Dashboard)
-- =============================================================================
-- Project: regfdfsyfjluanrsjftc
-- App does NOT provision on login. Only this cron + manual test create dailies.
-- =============================================================================

-- STEP A — SQL Editor (skip if you already ran these successfully)
--   1) supabase/migrations/20260526_quest_system_v3.sql
--   2) supabase/migrations/20260526_quest_service_role_grants.sql

-- STEP B — Database → Extensions → enable: pg_cron, pg_net

-- STEP C — Terminal (project folder):
--   npx supabase functions deploy provision-daily-quests --no-verify-jwt

-- STEP D — SQL Editor: paste YOUR service_role key from Dashboard → Settings → API
--   (replace PASTE_SERVICE_ROLE_KEY below — do not commit this file with a real key)

select cron.unschedule('provision-daily-quests') where exists (
  select 1 from cron.job where jobname = 'provision-daily-quests'
);

select cron.schedule(
  'provision-daily-quests',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://regfdfsyfjluanrsjftc.supabase.co/functions/v1/provision-daily-quests',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer PASTE_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- STEP E — Prove it works (PowerShell, project folder):
--   $key = 'PASTE_SERVICE_ROLE_KEY'
--   $uri = 'https://regfdfsyfjluanrsjftc.supabase.co/functions/v1/provision-daily-quests'
--   Invoke-RestMethod -Method Post -Uri $uri -Headers @{
--     Authorization = "Bearer $key"; 'Content-Type' = 'application/json'
--   } -Body '{}'
-- Expect: results with dailyCount (not 401/500)

-- STEP F — Open app: quests should already be on the board. Briefing modal only; no generation.

-- Cron time: 0 4 * * * UTC = 05:00 Africa/Lagos
--
-- TROUBLESHOOTING — cron.job_run_details status "succeeded" only means pg_net queued HTTP.
-- Check Edge logs for provision-daily-quests: must be POST | 200, not 401.
-- If 401: Bearer in THIS job does not match Dashboard → API → service_role (copy fresh key
-- from the same place as quest-push-daily-ready, which must return 200).
-- After fixing, run STEP E once; then optional force for your user:
--   body := '{"userId":"YOUR_UUID","force":true}'::jsonb
