import { QUEST_SOURCE_TYPES } from '@/constants/questEngine'
import { QUEST_PERIODS } from '@/constants/questOptions'
import { QUEST_KIND, QUEST_STATUS } from '@/constants/questLifecycle'
import { isSuccessfullyDone } from '@/services/questCloseDayService'
import { getQuestsForAssignedDate } from '@/services/questService'
import { getTaskPool } from '@/services/taskPoolService'
import { loadPointsForQuest } from '@/utils/questBudget'
import { invokeAnalyzeQuest } from '@/services/aiAnalysisService'

async function classifyPoolTask(task) {
  let difficulty = 'medium'
  let questKind = task.quest_kind || 'execution'
  try {
    const raw = await invokeAnalyzeQuest({ title: task.title, context: task.context_note || '' })
    difficulty = raw.analysis?.difficulty || difficulty
    if (raw.analysis?.category === 'learning') questKind = QUEST_KIND.LEARNING
  } catch {
    /* fallback */
  }
  const loadPoints = loadPointsForQuest({ difficulty, questKind })
  return { difficulty, questKind, loadPoints }
}

export async function buildDailyCarryovers(yesterdayYmd) {
  const yesterdayQuests = await getQuestsForAssignedDate(yesterdayYmd, QUEST_PERIODS.DAILY)
  const pool = await getTaskPool()
  const poolById = Object.fromEntries(pool.map((t) => [t.id, t]))

  const carryovers = []

  for (const quest of yesterdayQuests) {
    if (isSuccessfullyDone(quest)) continue
    const poolRow = quest.task_pool_id ? poolById[quest.task_pool_id] : null
    const mandatory = poolRow?.mandatory ?? false
    const mustRecycle =
      mandatory ||
      quest.status === QUEST_STATUS.EXTENDED ||
      [QUEST_STATUS.ACTIVE, QUEST_STATUS.INCOMPLETE, QUEST_STATUS.ASSESSMENT_PENDING].includes(
        quest.status,
      )

    if (!mustRecycle && quest.status === QUEST_STATUS.EXPIRED && !mandatory) continue
    if (!mustRecycle && quest.status === QUEST_STATUS.FAILED && !mandatory) continue

    carryovers.push({
      taskPoolId: quest.task_pool_id,
      title: quest.title,
      period: QUEST_PERIODS.DAILY,
      difficulty: quest.difficulty,
      questKind: quest.quest_kind,
      loadPoints: quest.load_points,
      sourceType: quest.source_type || QUEST_SOURCE_TYPES.TASK_POOL,
      carryover: true,
      priorQuestId: quest.id,
      mandatory,
    })
  }

  return carryovers
}

export async function buildPoolCandidatesForDaily(eligibleTypes, excludePoolIds = new Set()) {
  const pool = await getTaskPool()
  const candidates = []

  for (const task of pool) {
    if (!eligibleTypes.includes(task.type)) continue
    if (excludePoolIds.has(task.id)) continue
    const meta = await classifyPoolTask(task)
    candidates.push({
      id: task.id,
      taskPoolId: task.id,
      title: task.title,
      type: task.type,
      contextNote: task.context_note,
      mandatory: task.mandatory,
      priority: task.priority,
      ...meta,
      sourceType: 'task_pool',
    })
  }

  return candidates
}
