import { QUEST_SOURCE_TYPES } from '@/constants/questEngine'
import { QUEST_PERIODS } from '@/constants/questOptions'
import { QUEST_KIND } from '@/constants/questLifecycle'
import { MAX_EXTRA_DAILY_QUESTS_PER_DAY } from '@/constants/extraDailyQuest'
import { invokeAssignDailyQuests } from '@/services/questAiService'
import { getSkills } from '@/services/skillsService'
import { buildPoolCandidatesForDaily } from '@/services/questCarryoverService'
import { entryFromPacked } from '@/services/questAssignmentService'
import {
  createQuestEntries,
  getQuestsForAssignedDate,
  getTaskPoolIdsAssignedOnDate,
} from '@/services/questService'
import { getTaskPool, incrementTaskAssignmentCount } from '@/services/taskPoolService'
import { mergeHunterProfileContext } from '@/utils/hunterProfile'
import {
  candidateFitsRemainderWindow,
  EXTRA_DAILY_REMAINDER_TIER,
  getExtraDailyRemainderWindow,
} from '@/utils/extraDailyRemainder'
import { loadPointsForQuest } from '@/utils/questBudget'
import { getProfileTimezone, getTodayYmdInTimezone } from '@/utils/questTimezone'
import { isSundayYmd, filterSundayPoolCandidates } from '@/utils/sundayProvision'
import { TASK_POOL_PRIORITY } from '@/constants/questLifecycle'

function sortPoolForExtra(candidates, window) {
  const isLight =
    window.tier === EXTRA_DAILY_REMAINDER_TIER.WIND_DOWN ||
    window.tier === EXTRA_DAILY_REMAINDER_TIER.LIGHT
  return [...candidates].sort((a, b) => {
    if (isLight) {
      const loadDiff = Number(a.loadPoints ?? 0) - Number(b.loadPoints ?? 0)
      if (loadDiff !== 0) return loadDiff
    } else {
      if (a.mandatory !== b.mandatory) return a.mandatory ? -1 : 1
      if (a.priority === TASK_POOL_PRIORITY.HIGH && b.priority !== TASK_POOL_PRIORITY.HIGH) return -1
      if (b.priority === TASK_POOL_PRIORITY.HIGH && a.priority !== TASK_POOL_PRIORITY.HIGH) return 1
      return Number(b.drop_count ?? 0) - Number(a.drop_count ?? 0)
    }
    return String(a.title).localeCompare(String(b.title))
  })
}

async function pickFromPool({ todayYmd, window, profile }) {
  const assignedPoolIds = new Set(await getTaskPoolIdsAssignedOnDate(todayYmd, QUEST_PERIODS.DAILY))
  let candidates = await buildPoolCandidatesForDaily(['daily_eligible', 'both'], assignedPoolIds)
  if (isSundayYmd(todayYmd)) candidates = filterSundayPoolCandidates(candidates)
  candidates = candidates.filter((c) => candidateFitsRemainderWindow(c, window))
  const sorted = sortPoolForExtra(candidates, window)
  return sorted[0] ?? null
}

async function pickFromAi({ profile, skills, todayYmd, window, assignedPoolIds, todaysQuests }) {
  const pool = await getTaskPool()
  const poolForAi = pool
    .filter((t) => !assignedPoolIds.has(t.id))
    .map((t) => ({ id: t.id, title: t.title, mandatory: t.mandatory, priority: t.priority }))

  const suggestions = await invokeAssignDailyQuests({
    hunterVision: mergeHunterProfileContext(profile),
    skills: (skills ?? []).map((s) => ({ name: s.name, level: s.level, type: s.skill_type })),
    pool: poolForAi,
    carryovers: (todaysQuests ?? []).map((q) => ({ title: q.title, loadPoints: q.load_points })),
    remainingBudget: window.maxLoadPoints,
    assignedDate: todayYmd,
    mode: 'extra_single',
    remainderTier: window.tier,
    localHour: window.hour,
    hoursUntilMidnight: window.hoursUntilMidnight,
    remainderHint: window.label,
  })

  for (const s of suggestions ?? []) {
    const difficulty = s.difficulty || 'medium'
    const questKind = s.questKind || (s.category === 'learning' ? QUEST_KIND.LEARNING : QUEST_KIND.EXECUTION)
    const item = {
      title: s.title,
      taskPoolId: s.taskPoolId || null,
      difficulty,
      questKind,
      loadPoints: s.loadPoints || loadPointsForQuest({ difficulty, questKind }),
      sourceType: s.taskPoolId ? QUEST_SOURCE_TYPES.TASK_POOL : QUEST_SOURCE_TYPES.AI_GENERATED,
      contextNote: s.context || '',
    }
    if (item.taskPoolId && assignedPoolIds.has(item.taskPoolId)) continue
    if (!candidateFitsRemainderWindow(item, window)) continue
    return item
  }
  return null
}

function countExtraDailiesToday(quests) {
  return (quests ?? []).filter((q) => q.analysis_snapshot?.extra_daily).length
}

/** One bonus daily when main pack is done — pool first, then AI. Load capped by time of day. */
export async function requestExtraDailyQuest(profile) {
  const tz = getProfileTimezone(profile)
  const todayYmd = getTodayYmdInTimezone(tz)
  const window = getExtraDailyRemainderWindow(tz)
  const todaysQuests = await getQuestsForAssignedDate(todayYmd, QUEST_PERIODS.DAILY)

  if (countExtraDailiesToday(todaysQuests) >= MAX_EXTRA_DAILY_QUESTS_PER_DAY) {
    throw new Error(`Max ${MAX_EXTRA_DAILY_QUESTS_PER_DAY} extra tasks per day.`)
  }

  const assignedPoolIds = new Set(await getTaskPoolIdsAssignedOnDate(todayYmd, QUEST_PERIODS.DAILY))
  let picked = await pickFromPool({ todayYmd, window, profile })

  if (!picked) {
    const skills = await getSkills().catch(() => [])
    picked = await pickFromAi({
      profile,
      skills,
      todayYmd,
      window,
      assignedPoolIds,
      todaysQuests,
    })
  }

  if (!picked) {
    throw new Error(
      'Nothing suitable for the time left today — add lighter tasks to your pool or try earlier tomorrow.',
    )
  }

  const entry = entryFromPacked(picked, todayYmd, QUEST_PERIODS.DAILY)
  entry.analysisSnapshot = {
    ...(entry.analysisSnapshot ?? {}),
    extra_daily: true,
    remainder_tier: window.tier,
    remainder_hour: window.hour,
  }

  const [created] = await createQuestEntries([entry])

  if (picked.taskPoolId) {
    const poolRows = await getTaskPool()
    const row = poolRows.find((t) => t.id === picked.taskPoolId)
    if (row) await incrementTaskAssignmentCount(picked.taskPoolId, row.times_assigned)
  }

  return { quest: created, window }
}
