import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

export function createServiceSupabase() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return null
  return createClient(url, key)
}
