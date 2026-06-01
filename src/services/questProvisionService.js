import { QUEST_PERIODS } from '@/constants/questOptions'
import { getProfile } from '@/services/profileService'
import { getSkills } from '@/services/skillsService'
import { getQuestsForAssignedDate, markDailyProvisionComplete } from '@/services/questService'
import { closeQuestDay } from '@/services/questCloseDayService'
import { buildDailyCarryovers, buildPoolCandidatesForDaily } from '@/services/questCarryoverService'
import { assignDailyQuests } from '@/services/questAssignmentService'
import { buildWeeklyScheduledCandidates } from '@/services/questWeeklySchedulingService'
import { applyAutoWeeklyFocus } from '@/services/weeklyFocusAutoService'
import { provisionRecallQuestsForToday } from '@/services/questRecallService'
import { syncCuriosityRotation } from '@/services/curiosityRotationService'
import { provisionCuriosityQuestsForToday } from '@/services/curiosityProvisionService'
import { provisionSundayMentalQuestForToday } from '@/services/sundayMentalProvisionService'
import { packQuestCandidates } from '@/utils/questAssignment'
import {
  filterSundayCarryovers,
  filterSundayPoolCandidates,
  isSundayYmd,
} from '@/utils/sundayProvision'
import {
  computeBehaviorAdjustment,
  computeBreezeBonus,
  computeDailyBudgetPoints,
} from '@/utils/questBudget'
import { getRecentQuestLogs } from '@/services/questMetricsService'
import {
  getTodayYmdInTimezone,
  getYesterdayYmdInTimezone,
  getProfileTimezone,
  isProvisionWindowOpen,
} from '@/utils/questTimezone'

/**
 * After 05:00 in quest_timezone: provision if there are no daily rows for today.
 * Ignores last_daily_provision_at so a failed cron (or stamp with zero quests) still recovers on app open.
 */
export async function needsDailyProvision(profile) {
  const tz = getProfileTimezone(profile)
  if (!isProvisionWindowOpen(tz)) return false

  const today = getTodayYmdInTimezone(tz)
  const allToday = await getQuestsForAssignedDate(today, QUEST_PERIODS.DAILY)
  return allToday.length === 0
}

export async function runDailyProvision({ force = false } = {}) {
  const profile = await getProfile()
  const tz = getProfileTimezone(profile)
  const today = getTodayYmdInTimezone(tz)
  const yesterday = getYesterdayYmdInTimezone(tz)

  if (!force && !(await needsDailyProvision(profile))) {
    return { skipped: true, reason: 'already_provisioned' }
  }

  const recentLogs = await getRecentQuestLogs()
  const behaviorAdj = computeBehaviorAdjustment(recentLogs)
  const breezeBonus = computeBreezeBonus(recentLogs)
  const dailyBudget = computeDailyBudgetPoints({
    bandwidth: profile.quest_bandwidth || 'normal',
    behaviorAdj,
    breezeBonus,
    override: profile.daily_budget_points_override,
  })

  await closeQuestDay({ assignedDate: yesterday, profile, recentLogs })

  await applyAutoWeeklyFocus(profile)

  const profileAfterCuriosity = await syncCuriosityRotation(profile, today)

  const sunday = isSundayYmd(today)
  let carryovers = await buildDailyCarryovers(yesterday)
  if (sunday) carryovers = filterSundayCarryovers(carryovers)

  const usedPoolIds = new Set(carryovers.map((c) => c.taskPoolId).filter(Boolean))
  let poolCandidates = await buildPoolCandidatesForDaily(['daily_eligible'], usedPoolIds)
  let weeklyCandidates = await buildWeeklyScheduledCandidates({ timezone: tz })
  if (sunday) {
    poolCandidates = filterSundayPoolCandidates(poolCandidates)
    weeklyCandidates = filterSundayPoolCandidates(weeklyCandidates)
  }

  const skills = await getSkills()
  const dailyCreated = await assignDailyQuests({
    profile: profileAfterCuriosity,
    skills,
    carryovers,
    poolCandidates,
    weeklyCandidates,
    totalBudget: dailyBudget,
    todayYmd: today,
  })
  const weeklyPoolIds = new Set(weeklyCandidates.map((c) => c.taskPoolId).filter(Boolean))
  const weeklyCreatedCount = dailyCreated.filter((q) => weeklyPoolIds.has(q.task_pool_id)).length

  const packedForCuriosity = packQuestCandidates({
    carryovers,
    poolTasks: [...poolCandidates, ...weeklyCandidates],
    aiSuggestions: [],
    totalBudget: dailyBudget,
  })
  const curiosityCreated = await provisionCuriosityQuestsForToday({
    profile: profileAfterCuriosity,
    todayYmd: today,
    packed: packedForCuriosity,
  })

  const sundayMentalCreated = await provisionSundayMentalQuestForToday({
    profile: profileAfterCuriosity,
    todayYmd: today,
    packed: packedForCuriosity,
  })

  const recallCreated = await provisionRecallQuestsForToday(today)

  await markDailyProvisionComplete()

  return {
    skipped: false,
    today,
    dailyCount: dailyCreated.length,
    weeklyCount: weeklyCreatedCount,
    recallCount: recallCreated.length,
    curiosityCount: curiosityCreated.length,
    sundayMentalCount: sundayMentalCreated.length,
    budget: dailyBudget,
  }
}
