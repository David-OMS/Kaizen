import { corsHeaders } from '../_shared/cors.ts'
import { isCronOrServiceRequest, unauthorizedCronMessage } from '../_shared/cronAuth.ts'
import { sendQuestPushNotifications } from '../_shared/questPush.ts'
import { createServiceSupabase } from '../_shared/supabaseAdmin.ts'

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
  if (!supabase) return json({ error: 'Server misconfigured' }, 500)

  let body: { type?: string } = {}
  try {
    const text = await req.text()
    if (text) body = JSON.parse(text)
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const type = body.type === 'daily_reminder' ? 'daily_reminder' : 'daily_ready'

  try {
    const result = await sendQuestPushNotifications(supabase, type)
    return json({ result })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
