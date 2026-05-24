import { subDays } from 'date-fns'
import { QUEST_BREEZE } from '@/constants/questBudget'
import { supabase } from '@/services/supabase'

export async function getRecentQuestLogs(days = QUEST_BREEZE.lookbackDays) {
  const since = subDays(new Date(), days).toISOString()
  const { data, error } = await supabase
    .from('quest_log')
    .select('outcome, period, logged_at')
    .gte('logged_at', since)
    .order('logged_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export function completionRateFromLogs(logs) {
  if (!logs?.length) return 1
  const ok = logs.filter((l) => l.outcome === 'completed' || l.outcome === 'assessment_pass').length
  return ok / logs.length
}
