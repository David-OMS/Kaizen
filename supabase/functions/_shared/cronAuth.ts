import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

function extractBearer(req: Request): string {
  const auth = req.headers.get('Authorization') ?? req.headers.get('authorization') ?? ''
  const match = auth.match(/^Bearer\s+(.+)$/i)
  if (match?.[1]) return match[1].trim()
  const apikey = req.headers.get('apikey')?.trim()
  return apikey ?? ''
}

/** Prove key is service_role by calling Admin API (anon key cannot). */
async function tokenIsServiceRole(token: string): Promise<boolean> {
  const url = Deno.env.get('SUPABASE_URL')
  if (!url || !token) return false
  const client = createClient(url, token, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await client.auth.admin.listUsers({ page: 1, perPage: 1 })
  return !error
}

/** Cron / service invocations — not logged-in user JWT. */
export async function isCronOrServiceRequest(req: Request): Promise<boolean> {
  const cronSecret = Deno.env.get('CRON_SECRET')?.trim() ?? ''
  const headerSecret = req.headers.get('x-cron-secret')?.trim() ?? ''
  if (cronSecret && headerSecret === cronSecret) return true

  const bearer = extractBearer(req)
  if (!bearer) return false

  const envKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim() ?? ''
  if (envKey && bearer === envKey) return true

  return tokenIsServiceRole(bearer)
}

export function unauthorizedCronMessage(): string {
  return 'Unauthorized — send service_role as Authorization: Bearer <key>. On Windows use Invoke-RestMethod (see quest doc); redeploy provision-daily-quests after pulls.'
}
