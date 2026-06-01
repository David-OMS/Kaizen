import { SAPIEN_DAILY_XP_BY_LEVEL } from '@/constants/sapienHabitXp'

/** Plan for a full roster at mid integration (level 3 × max habits). */
export const SAPIEN_MAX_HABITS = 20
const REFERENCE_DAILY_XP =
  SAPIEN_MAX_HABITS * (SAPIEN_DAILY_XP_BY_LEVEL[3] ?? 12)

/** Calendar days of full-roster completion equivalent — not “one sloppy afternoon”. */
const RANK_DAY_TARGETS = {
  mortal: 0,
  initiate: 4,
  disciplined: 21,
  ascendant: 45,
  paragon: 90,
  transcendent: 180,
  demigod: 365,
}

function minXpForRankDays(days) {
  return Math.round(days * REFERENCE_DAILY_XP)
}

/** Sapien progression: Mortal → Demi-God (separate from Hunter rank). */
export const SAPIEN_RANKS = [
  { key: 'mortal', title: 'Mortal', minXp: minXpForRankDays(RANK_DAY_TARGETS.mortal) },
  { key: 'initiate', title: 'Initiate', minXp: minXpForRankDays(RANK_DAY_TARGETS.initiate) },
  { key: 'disciplined', title: 'Disciplined', minXp: minXpForRankDays(RANK_DAY_TARGETS.disciplined) },
  { key: 'ascendant', title: 'Ascendant', minXp: minXpForRankDays(RANK_DAY_TARGETS.ascendant) },
  { key: 'paragon', title: 'Paragon', minXp: minXpForRankDays(RANK_DAY_TARGETS.paragon) },
  { key: 'transcendent', title: 'Transcendent', minXp: minXpForRankDays(RANK_DAY_TARGETS.transcendent) },
  { key: 'demigod', title: 'Demi-God', minXp: minXpForRankDays(RANK_DAY_TARGETS.demigod) },
]

export const SAPIEN_REFERENCE_DAILY_XP = REFERENCE_DAILY_XP

export const SAPIEN_HABIT_KIND = {
  ONCE: 'once',
  COUNT: 'count',
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
