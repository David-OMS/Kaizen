import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const RECALL_OFFSETS = [
  { kind: 'd1', days: 1 },
  { kind: 'd3', days: 3 },
  { kind: 'd7', days: 7 },
]

function addDaysYmd(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00`)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function provisionRecallQuestsForToday(
  supabase: SupabaseClient,
  userId: string,
  todayYmd: string,
): Promise<number> {
  const { data: dueRows, error } = await supabase
    .from('quest_recall_schedule')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lte('due_date', todayYmd)
    .order('due_date', { ascending: true })
    .limit(3)

  if (error) throw error
  if (!dueRows?.length) return 0

  const inserts = dueRows.map((row) => ({
    user_id: userId,
    task_pool_id: null,
    title: `Recall: ${row.source_title}`,
    period: 'daily',
    assigned_date: todayYmd,
    due_date: todayYmd,
    status: 'active',
    xp_reward: 0,
    xp_penalty: 0,
    source_type: 'system_generated',
    reward_visibility: 'known',
    accepted: true,
    difficulty: 'easy',
    fear_level: 1,
    quest_kind: 'learning',
    load_points: 0,
    carryover: false,
    assessment_status: 'none',
    extension_count: 0,
    is_micro: true,
    recall_source_quest_id: row.source_quest_id,
    recall_kind: row.recall_kind,
    analysis_snapshot: {
      recall: true,
      battle_intel: row.battle_intel,
      source_title: row.source_title,
    },
  }))

  const { data: created, error: insErr } = await supabase.from('quests').insert(inserts).select('id')
  if (insErr) throw insErr

  for (let i = 0; i < dueRows.length; i += 1) {
    await supabase
      .from('quest_recall_schedule')
      .update({ status: 'assigned', recall_quest_id: created?.[i]?.id ?? null })
      .eq('id', dueRows[i].id)
  }

  return inserts.length
}
