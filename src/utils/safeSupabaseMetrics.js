import { supabase } from '@/services/supabase'

function isIgnorableMetricError(error) {
  if (!error) return false
  const code = String(error.code || '')
  const msg = String(error.message || '').toLowerCase()
  return (
    code === '42703' ||
    code === '42P01' ||
    code === 'PGRST204' ||
    msg.includes('does not exist') ||
    msg.includes('could not find') ||
    msg.includes('relation') ||
    msg.includes('column')
  )
}

/** Count query that returns 0 when optional columns/tables are missing (never blocks unlock flow). */
export async function countOrZero(buildQuery) {
  const { count, error } = await buildQuery()
  if (error) {
    if (isIgnorableMetricError(error)) return 0
    throw error
  }
  return count ?? 0
}

/** Sum query that returns 0 when spoil tables are missing. */
export async function sumOrZero(buildQuery) {
  const { data, error } = await buildQuery()
  if (error) {
    if (isIgnorableMetricError(error)) return 0
    throw error
  }
  return (data ?? []).reduce((total, row) => total + Number(row.amount ?? 0), 0)
}

/** True/false existence checks — false when table/column missing. */
export async function existsOrFalse(buildQuery) {
  const count = await countOrZero(buildQuery)
  return count >= 1
}

export async function waitUntilAuthReady() {
  const delays = [0, 200, 400, 800, 1600]
  let lastError = null

  for (const ms of delays) {
    if (ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, ms))
    }

    const { data, error } = await supabase.auth.getSession()
    if (error) {
      lastError = error
      continue
    }
    if (!data.session?.access_token) continue

    const { data: profileRow, error: profileError } = await supabase
      .from('profile')
      .select('id')
      .maybeSingle()

    if (!profileError && profileRow?.id) return

    lastError = profileError ?? new Error('Profile row not ready yet.')
    const msg = String(profileError.message || '')
    const isAuthError =
      profileError.status === 401 ||
      msg.includes('401') ||
      msg.toLowerCase().includes('jwt') ||
      msg.toLowerCase().includes('not authenticated')

    if (!isAuthError) throw profileError
  }

  throw lastError ?? new Error('Auth session not ready for achievement sync.')
}
