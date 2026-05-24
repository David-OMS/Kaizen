import { endOfDay, endOfWeek, format, startOfDay, startOfWeek, subDays } from 'date-fns'
import { QUEST_DEFAULTS, QUEST_REWARD_VISIBILITY, QUEST_SOURCE_TYPES } from '@/constants/questEngine'
import { QUEST_PERIODS } from '@/constants/questOptions'
import { QUEST_STATUS } from '@/constants/questLifecycle'
import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { getQuestDueDate } from '@/utils/quest'

function mapQuestPayload(userId, entry) {
  return {
    user_id: userId,
    task_pool_id: entry.taskPoolId ?? null,
    title: entry.title,
    period: entry.period,
    assigned_date: entry.assignedDate,
    due_date: entry.dueDate,
    status: entry.status ?? QUEST_STATUS.ACTIVE,
    xp_reward: entry.xpReward ?? 0,
    xp_penalty: entry.xpPenalty ?? 0,
    source_type: entry.sourceType ?? QUEST_DEFAULTS.sourceType,
    reward_visibility: entry.rewardVisibility ?? QUEST_DEFAULTS.rewardVisibility,
    accepted: entry.accepted ?? QUEST_DEFAULTS.accepted,
    difficulty: entry.difficulty ?? QUEST_DEFAULTS.difficulty,
    fear_level: entry.fearLevel ?? QUEST_DEFAULTS.fearLevel,
    quest_kind: entry.questKind ?? 'execution',
    load_points: entry.loadPoints ?? 2,
    carryover: entry.carryover ?? false,
    grace_until: entry.graceUntil ?? null,
    extension_count: entry.extensionCount ?? 0,
    assessment_status: entry.assessmentStatus ?? 'none',
    analysis_snapshot: entry.analysisSnapshot ?? null,
  }
}

export async function getQuestsForAssignedDate(assignedDate, period) {
  let query = supabase.from('quests').select('*').eq('assigned_date', assignedDate)
  if (period) query = query.eq('period', period)
  const { data, error } = await query.order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

function getCurrentWindow(period) {
  if (period === 'daily') {
    const today = new Date()
    return {
      start: format(startOfDay(today), 'yyyy-MM-dd'),
      end: format(endOfDay(today), 'yyyy-MM-dd'),
    }
  }
  const now = new Date()
  return {
    start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  }
}

export async function getCurrentPeriodQuests(period) {
  const window = getCurrentWindow(period)
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('period', period)
    .gte('assigned_date', window.start)
    .lte('assigned_date', window.end)
    .order('assigned_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getActiveDailyQuestsForToday(assignedDate) {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('period', QUEST_PERIODS.DAILY)
    .eq('assigned_date', assignedDate)
    .in('status', [
      QUEST_STATUS.ACTIVE,
      QUEST_STATUS.EXTENDED,
      QUEST_STATUS.INCOMPLETE,
      QUEST_STATUS.ASSESSMENT_PENDING,
    ])

  if (error) throw error
  return data ?? []
}

export async function createQuestEntries(entries) {
  const userId = await getAuthenticatedUserId()
  const payload = entries.map((entry) => mapQuestPayload(userId, entry))
  const { data, error } = await supabase.from('quests').insert(payload).select('*')
  if (error) throw error
  return data ?? []
}

export async function updateQuestRow(questId, patch) {
  const { data, error } = await supabase
    .from('quests')
    .update(patch)
    .eq('id', questId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateQuestStatus(payload) {
  return updateQuestRow(payload.id, {
    status: payload.status,
    completed_at: payload.completedAt ?? null,
    assessment_status: payload.assessmentStatus,
    grace_until: payload.graceUntil,
    incomplete_reason: payload.incompleteReason,
    incomplete_ai_verdict: payload.incompleteAiVerdict,
    extension_count: payload.extensionCount,
    started_at: payload.startedAt,
  })
}

export async function appendQuestLogEntry(payload) {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('quest_log')
    .insert({
      user_id: userId,
      quest_id: payload.questId,
      title: payload.title,
      period: payload.period,
      outcome: payload.outcome,
      xp_delta: payload.xpDelta,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function getQuestLog(periodFilter) {
  let query = supabase.from('quest_log').select('*').order('logged_at', { ascending: false })
  if (periodFilter) query = query.eq('period', periodFilter)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function hasCompletedDailyOnDate(dateValue) {
  const start = format(startOfDay(dateValue), 'yyyy-MM-dd')
  const end = format(endOfDay(dateValue), 'yyyy-MM-dd')
  const { count, error } = await supabase
    .from('quest_log')
    .select('*', { count: 'exact', head: true })
    .eq('period', 'daily')
    .in('outcome', ['completed', 'assessment_pass'])
    .gte('logged_at', start)
    .lte('logged_at', end)

  if (error) throw error
  return (count ?? 0) > 0
}

export async function getYesterdayDailyCompletionStatus() {
  return hasCompletedDailyOnDate(subDays(new Date(), 1))
}

export async function getQuestsByIds(ids) {
  const unique = [...new Set((ids || []).filter(Boolean))]
  if (!unique.length) return []
  const { data, error } = await supabase.from('quests').select('*').in('id', unique)
  if (error) throw error
  return data ?? []
}

export async function updateQuestAnalysisFields(questId, { difficulty, fearLevel, analysisSnapshot }) {
  return updateQuestRow(questId, {
    difficulty,
    fear_level: fearLevel,
    analysis_snapshot: analysisSnapshot,
  })
}

export async function markDailyProvisionComplete() {
  const userId = await getAuthenticatedUserId()
  const { error } = await supabase.rpc('mark_daily_provision', { p_user_id: userId })
  if (error) {
    await supabase.from('profile').update({ last_daily_provision_at: new Date().toISOString() }).eq('id', userId)
  }
}

export async function updateProfileQuestFields(patch) {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase.from('profile').update(patch).eq('id', userId).select('*').single()
  if (error) throw error
  return data
}
