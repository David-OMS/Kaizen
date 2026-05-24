import { createClient } from 'jsr:@supabase/supabase-js@2'

export async function requireUser(req: Request) {
  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  const authHeader = req.headers.get('Authorization')
  if (!url || !anon) return { user: null, error: 'Server misconfigured' }
  if (!authHeader) return { user: null, error: 'Missing Authorization' }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { user: null, error: 'Missing bearer token' }

  const supabase = createClient(url, anon)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return { user: null, error: error?.message ?? 'Unauthorized' }
  return { user: data.user, error: null }
}
