import { AI_EDGE_FUNCTIONS } from '@/constants/aiAnalysis'
import { parseJsonStringArray } from '@/utils/curiosityPeriod'
import { updateProfileQuestFields } from '@/services/questService'
import { getProfileTimezone, getTodayYmdInTimezone } from '@/utils/questTimezone'
import { supabase } from '@/services/supabase'

const MAX_HISTORY = 300

export function hasBrainTeaserForToday(profile, todayYmd) {
  return profile?.daily_brain_teaser_date === todayYmd && Boolean(profile?.daily_brain_teaser_fact)
}

/** Fetch today's fact if missing (e.g. provision missed). */
export async function ensureDailyBrainTeaser(profile) {
  const tz = getProfileTimezone(profile)
  const today = getTodayYmdInTimezone(tz)
  if (hasBrainTeaserForToday(profile, today)) return profile

  const factsSeen = parseJsonStringArray(profile?.brain_teaser_facts_seen)
  const { data, error } = await supabase.functions.invoke(AI_EDGE_FUNCTIONS.PICK_BRAIN_TEASER, {
    body: { factsSeen },
  })
  if (error) throw error

  const fact = String(data?.fact || '').trim()
  if (!fact) return profile

  const nextSeen = [...new Set([...factsSeen, fact])].slice(-MAX_HISTORY)
  return updateProfileQuestFields({
    daily_brain_teaser_fact: fact,
    daily_brain_teaser_date: today,
    brain_teaser_facts_seen: nextSeen,
  })
}
