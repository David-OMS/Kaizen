import {
  QUEST_BANDWIDTH_DAILY_POINTS,
  QUEST_BANDWIDTH_WEEKLY_POINTS,
  QUEST_BREEZE,
  QUEST_BUDGET_BOUNDS,
  QUEST_LOAD_POINTS,
  QUEST_SOFT_DAILY_SLOT_TARGET,
} from '@/constants/questBudget'
import { QUEST_KIND } from '@/constants/questLifecycle'

export function loadPointsForQuest({ difficulty, questKind }) {
  const base = QUEST_LOAD_POINTS[difficulty] ?? QUEST_LOAD_POINTS.medium
  const bonus = questKind === QUEST_KIND.LEARNING ? QUEST_LOAD_POINTS.learningBonus : 0
  return base + bonus
}

export function computeBehaviorAdjustment(recentLogs) {
  if (!recentLogs?.length) return 0
  const completed = recentLogs.filter((l) => l.outcome === 'completed' || l.outcome === 'assessment_pass').length
  const rate = completed / recentLogs.length
  if (rate >= QUEST_BREEZE.minCompletionRate) return QUEST_BUDGET_BOUNDS.behaviorStep
  if (rate < 0.4) return -QUEST_BUDGET_BOUNDS.behaviorStep
  return 0
}

export function computeBreezeBonus(recentLogs) {
  if (!recentLogs?.length) return 0
  const completed = recentLogs.filter((l) => l.outcome === 'completed' || l.outcome === 'assessment_pass').length
  const rate = completed / recentLogs.length
  if (rate >= QUEST_BREEZE.minCompletionRate && recentLogs.length >= QUEST_BREEZE.minDaysForBonus) {
    return QUEST_BUDGET_BOUNDS.breezeBonus
  }
  return 0
}

export function computeDailyBudgetPoints({ bandwidth, behaviorAdj, breezeBonus, override }) {
  if (override != null && Number.isFinite(Number(override))) {
    return Math.min(QUEST_BUDGET_BOUNDS.dailyMax, Math.max(QUEST_BUDGET_BOUNDS.dailyMin, Number(override)))
  }
  const base = QUEST_BANDWIDTH_DAILY_POINTS[bandwidth] ?? QUEST_BANDWIDTH_DAILY_POINTS.normal
  const total = base + behaviorAdj + breezeBonus
  return Math.min(QUEST_BUDGET_BOUNDS.dailyMax, Math.max(QUEST_BUDGET_BOUNDS.dailyMin, total))
}

export function computeWeeklyBudgetPoints({ bandwidth, behaviorAdj }) {
  const base = QUEST_BANDWIDTH_WEEKLY_POINTS[bandwidth] ?? QUEST_BANDWIDTH_WEEKLY_POINTS.normal
  const total = base + behaviorAdj
  return Math.min(QUEST_BUDGET_BOUNDS.weeklyMax, Math.max(QUEST_BUDGET_BOUNDS.weeklyMin, total))
}

export function sumLoadPoints(items) {
  return (items ?? []).reduce((s, i) => s + Number(i.loadPoints ?? i.load_points ?? 0), 0)
}

export function remainingBudget(totalBudget, packed) {
  return Math.max(0, totalBudget - sumLoadPoints(packed))
}

export function canFitInBudget(packed, candidatePoints, totalBudget) {
  return sumLoadPoints(packed) + candidatePoints <= totalBudget
}

export function softSlotHintFromBudget(totalBudget) {
  return Math.min(QUEST_SOFT_DAILY_SLOT_TARGET, Math.max(1, Math.floor(totalBudget / 2)))
}
