import { addDays, format } from 'date-fns'
import { QUEST_KIND, QUEST_STATUS } from '@/constants/questLifecycle'
import { QUEST_PERIODS } from '@/constants/questOptions'
import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { createQuestEntries } from '@/services/questService'
import { getQuestDueDate } from '@/utils/quest'

const RECALL_OFFSETS = [
  { kind: 'd1', days: 1 },
  { kind: 'd3', days: 3 },
  { kind: 'd7', days: 7 },
]

export async function scheduleRecallAfterLearningPass(quest) {
  if (!quest?.battle_intel?.trim()) return []
  const userId = await getAuthenticatedUserId()
  const base = new Date()
  const rows = RECALL_OFFSETS.map(({ kind, days }) => ({
    user_id: userId,
    source_quest_id: quest.id,
    source_title: quest.title,
    battle_intel: quest.battle_intel,
    due_date: format(addDays(base, days), 'yyyy-MM-dd'),
    recall_kind: kind,
    status: 'pending',
  }))

  const { data, error } = await supabase.from('quest_recall_schedule').insert(rows).select('*')
  if (error) throw error
  return data ?? []
}

export async function provisionRecallQuestsForToday(todayYmd) {
  const userId = await getAuthenticatedUserId()
  const { data: dueRows, error } = await supabase
    .from('quest_recall_schedule')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lte('due_date', todayYmd)
    .order('due_date', { ascending: true })
    .limit(3)

  if (error) throw error
  if (!dueRows?.length) return []

  const entries = dueRows.map((row) => ({
    title: `Recall: ${row.source_title}`,
    period: QUEST_PERIODS.DAILY,
    assignedDate: todayYmd,
    dueDate: getQuestDueDate(QUEST_PERIODS.DAILY),
    status: QUEST_STATUS.ACTIVE,
    questKind: QUEST_KIND.LEARNING,
    loadPoints: 0,
    isMicro: true,
    recallSourceQuestId: row.source_quest_id,
    recallKind: row.recall_kind,
    sourceType: 'system_generated',
    analysisSnapshot: {
      recall: true,
      battle_intel: row.battle_intel,
      source_title: row.source_title,
    },
    xpReward: 0,
    xpPenalty: 0,
  }))

  const created = await createQuestEntries(entries)

  for (let i = 0; i < dueRows.length; i += 1) {
    await supabase
      .from('quest_recall_schedule')
      .update({ status: 'assigned', recall_quest_id: created[i]?.id ?? null })
      .eq('id', dueRows[i].id)
  }

  return created
}
