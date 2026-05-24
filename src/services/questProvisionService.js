import { format, startOfWeek } from 'date-fns'
import { QUEST_PERIODS } from '@/constants/questOptions'
import { getProfile } from '@/services/profileService'
import { getSkills } from '@/services/skillsService'
import {
  getActiveDailyQuestsForToday,
  getQuestsForAssignedDate,
  markDailyProvisionComplete,
} from '@/services/questService'
import { closeQuestDay } from '@/services/questCloseDayService'
import { buildDailyCarryovers, buildPoolCandidatesForDaily } from '@/services/questCarryoverService'
import { assignDailyQuests, assignWeeklyQuests } from '@/services/questAssignmentService'
import { getTaskPool } from '@/services/taskPoolService'
import {
  computeBehaviorAdjustment,
  computeBreezeBonus,
  computeDailyBudgetPoints,
  computeWeeklyBudgetPoints,
} from '@/utils/questBudget'
import { getRecentQuestLogs, completionRateFromLogs } from '@/services/questMetricsService'
import {
  getTodayYmdInTimezone,
  getYesterdayYmdInTimezone,
  getProfileTimezone,
  isProvisionWindowOpen,
} from '@/utils/questTimezone'

export async function needsDailyProvision(profile) {
  const tz = getProfileTimezone(profile)
  const today = getTodayYmdInTimezone(tz)
  const existing = await getActiveDailyQuestsForToday(today)
  if (existing.length) return false

  const allToday = await getQuestsForAssignedDate(today, QUEST_PERIODS.DAILY)
  if (allToday.length) return false

  const last = profile.last_daily_provision_at
  if (!last) return isProvisionWindowOpen(tz)

  const lastDay = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(last))
  return lastDay !== today && isProvisionWindowOpen(tz)
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

  const carryovers = await buildDailyCarryovers(yesterday)
  const usedPoolIds = new Set(carryovers.map((c) => c.taskPoolId).filter(Boolean))
  const poolCandidates = await buildPoolCandidatesForDaily(['daily_eligible', 'both'], usedPoolIds)

  const skills = await getSkills()
  const dailyCreated = await assignDailyQuests({
    profile,
    skills,
    carryovers,
    poolCandidates,
    totalBudget: dailyBudget,
    todayYmd: today,
  })

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekExisting = await getQuestsForAssignedDate(weekStart, QUEST_PERIODS.WEEKLY)
  let weeklyCreated = []

  if (!weekExisting.length) {
    const weeklyBudget = computeWeeklyBudgetPoints({
      bandwidth: profile.quest_bandwidth || 'normal',
      behaviorAdj,
    })
    const pool = await getTaskPool()
    weeklyCreated = await assignWeeklyQuests({
      pool,
      totalBudget: weeklyBudget,
      weekStartYmd: weekStart,
    })
  }

  await markDailyProvisionComplete()

  return {
    skipped: false,
    today,
    dailyCount: dailyCreated.length,
    weeklyCount: weeklyCreated.length,
    budget: dailyBudget,
  }
}
