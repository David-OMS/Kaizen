import { endOfDay, endOfWeek, format, startOfDay, startOfWeek, subDays } from 'date-fns'
import { QUEST_DEFAULTS, QUEST_REWARD_VISIBILITY, QUEST_SOURCE_TYPES } from '@/constants/questEngine'
import { QUEST_PERIODS } from '@/constants/questOptions'
import { QUEST_STATUS, TASK_POOL_OUTCOME } from '@/constants/questLifecycle'
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
    battle_intel: entry.battleIntel ?? null,
    battle_intel_at: entry.battleIntelAt ?? null,
    is_micro: entry.isMicro ?? false,
    recall_source_quest_id: entry.recallSourceQuestId ?? null,
    recall_kind: entry.recallKind ?? null,
    curiosity_track: entry.curiosityTrack ?? entry.analysisSnapshot?.curiosity_track ?? null,
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

export function getCurrentWeekBounds() {
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

export async function getCurrentWeekDailyQuests() {
  const window = getCurrentWeekBounds()
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('period', QUEST_PERIODS.DAILY)
    .gte('assigned_date', window.start)
    .lte('assigned_date', window.end)
    .order('assigned_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getDailyQuestsInWeekForTaskPoolIds(taskPoolIds) {
  const ids = [...new Set((taskPoolIds ?? []).filter(Boolean))]
  if (!ids.length) return []
  const { start, end } = getCurrentWeekBounds()
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('period', QUEST_PERIODS.DAILY)
    .in('task_pool_id', ids)
    .gte('assigned_date', start)
    .lte('assigned_date', end)
    .order('assigned_date', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getRecallQuestsForToday(assignedDate) {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('period', QUEST_PERIODS.DAILY)
    .eq('assigned_date', assignedDate)
    .eq('is_micro', true)
    .in('status', [
      QUEST_STATUS.ACTIVE,
      QUEST_STATUS.EXTENDED,
      QUEST_STATUS.ASSESSMENT_PENDING,
    ])
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

const OPEN_QUEST_STATUSES = [
  QUEST_STATUS.ACTIVE,
  QUEST_STATUS.EXTENDED,
  QUEST_STATUS.INCOMPLETE,
  QUEST_STATUS.ASSESSMENT_PENDING,
]

/** Drop a mistaken re-assignment when the pool track is already finished — no XP, no quest_log. */
export async function voidDuplicatePoolQuest(questId) {
  const userId = await getAuthenticatedUserId()
  const { data: quest, error: questErr } = await supabase
    .from('quests')
    .select('id, task_pool_id, status')
    .eq('id', questId)
    .eq('user_id', userId)
    .single()

  if (questErr) throw questErr
  if (!quest.task_pool_id) throw new Error('Only pool quests can be removed this way.')
  if (!OPEN_QUEST_STATUSES.includes(quest.status)) {
    throw new Error('Quest is not open.')
  }

  const { data: pool, error: poolErr } = await supabase
    .from('task_pool')
    .select('last_outcome')
    .eq('id', quest.task_pool_id)
    .eq('user_id', userId)
    .single()

  if (poolErr) throw poolErr
  if (pool.last_outcome !== TASK_POOL_OUTCOME.COMPLETED) {
    throw new Error('Pool task is not marked complete yet.')
  }

  const { error: deleteErr } = await supabase.from('quests').delete().eq('id', questId).eq('user_id', userId)
  if (deleteErr) throw deleteErr
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
