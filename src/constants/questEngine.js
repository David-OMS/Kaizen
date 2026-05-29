/** Quest row enums / defaults (Core Engine V2). */

export const QUEST_DIFFICULTIES = ['easy', 'medium', 'hard', 'legendary']

export const QUEST_SOURCE_TYPES = {
  TASK_POOL: 'task_pool',
  SYSTEM_GENERATED: 'system_generated',
  AI_GENERATED: 'ai_generated',
  CURIOSITY: 'curiosity',
}

export const QUEST_REWARD_VISIBILITY = {
  KNOWN: 'known',
  UNKNOWN: 'unknown',
}

export const QUEST_DEFAULTS = {
  difficulty: 'medium',
  fearLevel: 2,
  sourceType: QUEST_SOURCE_TYPES.TASK_POOL,
  rewardVisibility: QUEST_REWARD_VISIBILITY.KNOWN,
  accepted: true,
}
