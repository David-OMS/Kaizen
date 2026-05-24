/** All quest capacity numbers — tune here only. */

export const QUEST_DEFAULT_TIMEZONE = 'Africa/Lagos'

export const QUEST_BANDWIDTH = {
  LIGHT: 'light',
  NORMAL: 'normal',
  PUSH: 'push',
}

export const QUEST_BANDWIDTH_DAILY_POINTS = {
  light: 4,
  normal: 6,
  push: 8,
}

export const QUEST_BANDWIDTH_WEEKLY_POINTS = {
  light: 10,
  normal: 14,
  push: 18,
}

/** Soft target ~3 assignments when difficulty allows (not a hard row count). */
export const QUEST_SOFT_DAILY_SLOT_TARGET = 3

export const QUEST_LOAD_POINTS = {
  easy: 1,
  medium: 2,
  hard: 4,
  legendary: 6,
  learningBonus: 2,
}

export const QUEST_BUDGET_BOUNDS = {
  dailyMin: 3,
  dailyMax: 12,
  weeklyMin: 8,
  weeklyMax: 24,
  behaviorStep: 1,
  breezeBonus: 1,
}

export const QUEST_BREEZE = {
  lookbackDays: 14,
  minCompletionRate: 0.85,
  minDaysForBonus: 5,
}

export const QUEST_LENIENCY = {
  minStreak: 7,
  minCompletionRate: 0.7,
  graceHourNextDay: 8,
}

export const QUEST_EXTENSION = {
  maxPerQuest: 1,
  defaultExtensionHours: 24,
}

export const QUEST_PROVISION_HOUR = 5
