import { format } from 'date-fns'
import { QUEST_SOURCE_TYPES } from '@/constants/questEngine'
import { QUEST_PERIODS } from '@/constants/questOptions'
import { QUEST_KIND } from '@/constants/questLifecycle'
import { invokeAssignDailyQuests } from '@/services/questAiService'
import { invokeAnalyzeQuest } from '@/services/aiAnalysisService'
import { createQuestEntries } from '@/services/questService'
import { incrementTaskAssignmentCount, getTaskPool } from '@/services/taskPoolService'
import { packQuestCandidates } from '@/utils/questAssignment'
import { loadPointsForQuest } from '@/utils/questBudget'
import { getQuestDueDate } from '@/utils/quest'
import { resolveExecutionQuestXp } from '@/services/questRewardService'
import { getQuestRewards } from '@/utils/quest'

async function buildAiSuggestions({ profile, skills, pool, carryovers, remainingBudget, todayYmd }) {
  try {
    const suggestions = await invokeAssignDailyQuests({
      hunterVision: profile.hunter_vision || profile.hunter_goals || '',
      skills: (skills ?? []).map((s) => ({ name: s.name, level: s.level, type: s.skill_type })),
      pool: pool.map((t) => ({
        id: t.id,
        title: t.title,
        mandatory: t.mandatory,
        priority: t.priority,
      })),
      carryovers: carryovers.map((c) => ({ title: c.title, loadPoints: c.loadPoints })),
      remainingBudget,
      assignedDate: todayYmd,
    })

    return (suggestions ?? []).map((s) => {
      const difficulty = s.difficulty || 'medium'
      const questKind = s.questKind || (s.category === 'learning' ? QUEST_KIND.LEARNING : QUEST_KIND.EXECUTION)
      return {
        title: s.title,
        taskPoolId: s.taskPoolId || null,
        difficulty,
        questKind,
        loadPoints: s.loadPoints || loadPointsForQuest({ difficulty, questKind }),
        sourceType: QUEST_SOURCE_TYPES.AI_GENERATED,
        contextNote: s.context || '',
      }
    })
  } catch {
    return []
  }
}

function entryFromPacked(item, assignedDate, period) {
  const xp =
    item.questKind === QUEST_KIND.LEARNING
      ? { reward: 0, penalty: 0 }
      : resolveExecutionQuestXp({ period, xp_reward: 0, xp_penalty: 0 })

  if (item.questKind !== QUEST_KIND.LEARNING) {
    const computed = getQuestRewards(period)
    xp.reward = computed.reward
    xp.penalty = computed.penalty
  }

  return {
    taskPoolId: item.taskPoolId ?? null,
    title: item.title,
    period,
    assignedDate,
    dueDate: getQuestDueDate(period),
    xpReward: xp.reward,
    xpPenalty: xp.penalty,
    sourceType: item.sourceType || QUEST_SOURCE_TYPES.TASK_POOL,
    difficulty: item.difficulty || 'medium',
    fearLevel: 2,
    questKind: item.questKind || QUEST_KIND.EXECUTION,
    loadPoints: item.loadPoints,
    carryover: item.carryover ?? false,
    accepted: true,
  }
}

export async function assignDailyQuests({
  profile,
  skills,
  carryovers,
  poolCandidates,
  totalBudget,
  todayYmd,
}) {
  const usedPoints = carryovers.reduce((s, c) => s + Number(c.loadPoints || 0), 0)
  const remaining = Math.max(0, totalBudget - usedPoints)
  const pool = await getTaskPool()
  const aiSuggestions = await buildAiSuggestions({
    profile,
    skills,
    pool,
    carryovers,
    remainingBudget: remaining,
    todayYmd,
  })

  const packed = packQuestCandidates({
    carryovers,
    poolTasks: poolCandidates,
    aiSuggestions,
    totalBudget,
  })

  if (!packed.length) return []

  const entries = packed.map((item) => entryFromPacked(item, todayYmd, QUEST_PERIODS.DAILY))
  const created = await createQuestEntries(entries)

  const poolRows = await getTaskPool()
  const countById = Object.fromEntries(poolRows.map((t) => [t.id, t.times_assigned]))

  for (const item of packed) {
    if (item.taskPoolId) {
      await incrementTaskAssignmentCount(item.taskPoolId, countById[item.taskPoolId])
    }
  }

  return created
}

export async function assignWeeklyQuests({ pool, totalBudget, weekStartYmd }) {
  const weeklyPool = []
  for (const task of pool ?? []) {
    if (!['weekly_eligible', 'both'].includes(task.type)) continue
    const difficulty = 'medium'
    const questKind = task.quest_kind || QUEST_KIND.EXECUTION
    weeklyPool.push({
      taskPoolId: task.id,
      title: task.title,
      type: task.type,
      difficulty,
      questKind,
      loadPoints: loadPointsForQuest({ difficulty, questKind }),
      sourceType: QUEST_SOURCE_TYPES.TASK_POOL,
    })
  }

  const packed = packQuestCandidates({
    carryovers: [],
    poolTasks: weeklyPool,
    aiSuggestions: [],
    totalBudget,
  })

  if (!packed.length) return []

  const entries = packed.map((item) => entryFromPacked(item, weekStartYmd, QUEST_PERIODS.WEEKLY))
  return createQuestEntries(entries)
}
