import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { parseJsonStringArray } from './curiosityPeriod.ts'

const MAX_HISTORY = 300

async function fetchPickBrainTeaser(
  supabaseUrl: string,
  serviceKey: string,
  factsSeen: string[],
): Promise<string | null> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/pick-daily-brain-teaser`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ factsSeen }),
    })
    if (!res.ok) return null
    const body = await res.json()
    const fact = body.fact ? String(body.fact).trim() : ''
    return fact || null
  } catch {
    return null
  }
}

export async function provisionDailyBrainTeaser(
  supabase: SupabaseClient,
  userId: string,
  profile: Record<string, unknown>,
  todayYmd: string,
  opts: { supabaseUrl: string; serviceKey: string },
): Promise<Record<string, unknown>> {
  if (profile.daily_brain_teaser_date === todayYmd && profile.daily_brain_teaser_fact) {
    return profile
  }

  const factsSeen = parseJsonStringArray(profile.brain_teaser_facts_seen)
  const fact = await fetchPickBrainTeaser(opts.supabaseUrl, opts.serviceKey, factsSeen)
  if (!fact) return profile

  const nextSeen = [...new Set([...factsSeen, fact])].slice(-MAX_HISTORY)
  const { data, error } = await supabase
    .from('profile')
    .update({
      daily_brain_teaser_fact: fact,
      daily_brain_teaser_date: todayYmd,
      brain_teaser_facts_seen: nextSeen,
    })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data as Record<string, unknown>
}
