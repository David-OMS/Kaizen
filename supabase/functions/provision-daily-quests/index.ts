import { corsHeaders } from '../_shared/cors.ts'
import { isCronOrServiceRequest, unauthorizedCronMessage } from '../_shared/cronAuth.ts'
import { createServiceSupabase } from '../_shared/supabaseAdmin.ts'
import { runDailyProvisionAllUsers, runDailyProvisionForUser } from '../_shared/dailyProvisionRunner.ts'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (!(await isCronOrServiceRequest(req))) {
    return json({ error: unauthorizedCronMessage() }, 401)
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabase = createServiceSupabase()
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabase || !url || !serviceKey) {
    return json({ error: 'Server misconfigured (missing Supabase env)' }, 500)
  }

  let body: { userId?: string; force?: boolean } = {}
  try {
    const text = await req.text()
    if (text) body = JSON.parse(text)
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const opts = { force: Boolean(body.force), supabaseUrl: url, serviceKey }

  try {
    if (body.userId) {
      const result = await runDailyProvisionForUser(supabase, body.userId, opts)
      return json({ result })
    }
    const results = await runDailyProvisionAllUsers(supabase, opts)
    return json({ results })
  } catch (e) {
    const err = e as { message?: string; code?: string; hint?: string; details?: string }
    return json(
      {
        error: err?.message ?? String(e),
        code: err?.code ?? null,
        details: err?.details ?? null,
        dbHint:
          '42703: run quest migrations. 42501 on quest_recall_schedule: run supabase/migrations/20260609_quest_recall_service_role_grants.sql',
      },
      500,
    )
  }
})
