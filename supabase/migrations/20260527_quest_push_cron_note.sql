-- =============================================================================
-- Quest push notifications (Web Push) — run after VAPID keys are set
-- =============================================================================
--
-- 1) Generate keys (terminal):
--      npx web-push generate-vapid-keys
--
-- 2) Supabase → Project Settings → Edge Functions → Secrets:
--      VAPID_PUBLIC_KEY=<public>
--      VAPID_PRIVATE_KEY=<private>
--      VAPID_SUBJECT=mailto:you@yourdomain.com
--
-- 3) Vercel / local .env (same public key):
--      VITE_VAPID_PUBLIC_KEY=<public>
--
-- 4) Deploy:
--      npx supabase functions deploy send-quest-notifications --no-verify-jwt
--
-- 5) SQL Editor — replace PASTE_SERVICE_ROLE_KEY, run schedule block below
--    (requires pg_cron + pg_net, same as quest provision)
--
-- Times (Africa/Lagos): daily ready ~05:05, evening reminder ~20:00

select cron.unschedule('quest-push-daily-ready') where exists (
  select 1 from cron.job where jobname = 'quest-push-daily-ready'
);
select cron.unschedule('quest-push-daily-reminder') where exists (
  select 1 from cron.job where jobname = 'quest-push-daily-reminder'
);

select cron.schedule(
  'quest-push-daily-ready',
  '5 4 * * *',
  $$
  select net.http_post(
    url := 'https://regfdfsyfjluanrsjftc.supabase.co/functions/v1/send-quest-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer PASTE_SERVICE_ROLE_KEY'
    ),
    body := '{"type":"daily_ready"}'::jsonb
  ) as request_id;
  $$
);

select cron.schedule(
  'quest-push-daily-reminder',
  '0 19 * * *',
  $$
  select net.http_post(
    url := 'https://regfdfsyfjluanrsjftc.supabase.co/functions/v1/send-quest-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer PASTE_SERVICE_ROLE_KEY'
    ),
    body := '{"type":"daily_reminder"}'::jsonb
  ) as request_id;
  $$
);
