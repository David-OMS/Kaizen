import { QUEST_KIND } from '@/constants/questLifecycle'
import { TASK_POOL_HORIZON, TASK_SCHEDULE_MODE } from '@/constants/taskPoolSchedule'
import { mergeHunterProfileContext } from '@/utils/hunterProfile'

const LONG_TRACK_HINTS =
  /\b(french|language|fluency|udemy|course|system design|bootcamp|consistently|every week|long.?term|months?|daily practice)\b/i

export function inferTaskPoolFields({
  title,
  contextNote,
  questKind,
  mandatory,
  linkedClientId,
  profile,
  scheduleMode,
  weeklyQuotaTarget,
}) {
  const text = `${title} ${contextNote || ''}`.toLowerCase()
  const vision = mergeHunterProfileContext(profile).toLowerCase()

  const resolvedKind = questKind || QUEST_KIND.EXECUTION
  const isLearning = resolvedKind === QUEST_KIND.LEARNING
  const mode = scheduleMode || TASK_SCHEDULE_MODE.ONE_SHOT

  if (mode === TASK_SCHEDULE_MODE.MULTI_DAY) {
    return baseFields({
      type: 'daily_eligible',
      repeatPolicy: 'until_completed',
      inferredHorizon: TASK_POOL_HORIZON.MULTI_DAY,
      questKind: resolvedKind,
      mandatory,
      linkedClientId,
      text,
      vision,
      isLearning,
    })
  }

  if (mode === TASK_SCHEDULE_MODE.WEEKLY_QUOTA) {
    return {
      ...baseFields({
        type: 'daily_eligible',
        repeatPolicy: 'always',
        inferredHorizon: TASK_POOL_HORIZON.WEEKLY_QUOTA,
        questKind: QUEST_KIND.EXECUTION,
        mandatory: mandatory ?? true,
        linkedClientId,
        text,
        vision,
        isLearning: false,
      }),
      weekly_quota_target: Math.min(14, Math.max(1, Number(weeklyQuotaTarget) || 2)),
      weekly_quota_progress: 0,
      weekly_quota_week_start: null,
    }
  }

  const longTrack =
    mode === TASK_SCHEDULE_MODE.LEARNING_TRACK ||
    (!mandatory &&
      !linkedClientId &&
      isLearning &&
      (LONG_TRACK_HINTS.test(text) || LONG_TRACK_HINTS.test(vision)))

  if (mandatory || linkedClientId) {
    return baseFields({
      type: 'daily_eligible',
      repeatPolicy: 'until_completed',
      inferredHorizon: TASK_POOL_HORIZON.ONE_OFF,
      questKind: resolvedKind,
      mandatory,
      linkedClientId,
      text,
      vision,
      isLearning,
    })
  }

  if (longTrack) {
    return baseFields({
      type: 'weekly_eligible',
      repeatPolicy: 'always',
      inferredHorizon: TASK_POOL_HORIZON.LONG_TRACK,
      questKind: resolvedKind,
      mandatory,
      linkedClientId,
      text,
      vision,
      isLearning,
      weeklyTargetDays: isLearning ? 4 : 3,
    })
  }

  return baseFields({
    type: 'daily_eligible',
    repeatPolicy: 'until_completed',
    inferredHorizon: TASK_POOL_HORIZON.ONE_OFF,
    questKind: resolvedKind,
    mandatory,
    linkedClientId,
    text,
    vision,
    isLearning,
  })
}

function baseFields({
  type,
  repeatPolicy,
  inferredHorizon,
  questKind,
  mandatory,
  linkedClientId,
  text,
  vision,
  isLearning,
  weeklyTargetDays = null,
}) {
  let goalAlignment = 40
  const tokens = text.split(/\W+/).filter((w) => w.length > 3)
  for (const token of tokens) {
    if (vision.includes(token)) goalAlignment += 8
  }
  goalAlignment = Math.min(100, goalAlignment)

  let inferredImportance = mandatory ? 90 : goalAlignment
  if (linkedClientId) inferredImportance = Math.max(inferredImportance, 85)
  if (isLearning) inferredImportance = Math.max(inferredImportance, 55)
  if (inferredHorizon === TASK_POOL_HORIZON.WEEKLY_QUOTA) inferredImportance = Math.max(inferredImportance, 80)

  return {
    type,
    repeat_policy: repeatPolicy,
    quest_kind: questKind,
    priority: inferredImportance >= 75 ? 'high' : 'normal',
    weekly_target_days: weeklyTargetDays,
    weekly_distribution_mode: 'adaptive',
    inferred_horizon: inferredHorizon,
    inferred_importance: inferredImportance,
    goal_alignment_score: goalAlignment,
    ai_confidence: 0.65,
    ai_classified_at: new Date().toISOString(),
    focus_active: type === 'weekly_eligible' ? true : true,
  }
}
