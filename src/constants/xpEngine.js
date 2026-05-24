/** Level curve + rank bands + rank gates (Core Engine V2). */

export const XP_ENGINE = {
  baseXp: {
    quest: 60,
    hunt: 40,
    raid_action: 90,
    skill_session: 50,
    dungeon_milestone: 140,
  },
  difficultyMultiplier: {
    easy: 1,
    medium: 1.5,
    hard: 2.3,
    legendary: 3.5,
  },
  fearMultiplier: {
    1: 1,
    2: 1.15,
    3: 1.35,
    4: 1.7,
    5: 2.2,
  },
  speedMultiplier: {
    late: 0.9,
    on_time: 1,
    fast: 1.15,
  },
  qualityMultiplier: {
    failed: 0.25,
    partial: 0.6,
    good: 1,
    excellent: 1.25,
  },
  streak: {
    perDayBonus: 0.02,
    maxMultiplier: 1.3,
  },
  level: {
    coefficient: 200,
    exponent: 1.55,
  },
}

/** Failed standard quests never grant less than this XP delta (consolation floor). */
export const QUEST_FAILURE_MIN_XP_DELTA = 10

/** Raid lifecycle XP multipliers (applied to calculateXP raid_action). */
export const RAID_START_XP_FACTOR = 0.35
export const RAID_START_XP_FLOOR = 20
export const RAID_COMPLETE_XP_FACTOR = 1.15
export const RAID_COMPLETE_XP_FLOOR = 80

/** Strict mirror — rank by level band. */
export const LEVEL_RANKS = [
  { key: 'E', title: 'Registered Entity', minLevel: 1, maxLevel: 14 },
  { key: 'D', title: 'Hunter', minLevel: 15, maxLevel: 28 },
  { key: 'C', title: 'System Architect', minLevel: 29, maxLevel: 48 },
  { key: 'B', title: 'Field Operator', minLevel: 49, maxLevel: 68 },
  { key: 'A', title: 'Guild Leader', minLevel: 69, maxLevel: 88 },
  { key: 'S', title: 'Shadow Monarch', minLevel: 89, maxLevel: null },
]

export const RANK_ORDER = LEVEL_RANKS.map((rank) => rank.key)

/**
 * Gates are mandatory in addition to level thresholds.
 * B monthlyIncomeMinNgn: defined but not enforced until B_INCOME_GATE_ENABLED.
 */
export const B_INCOME_GATE_ENABLED = false
export const B_MONTHLY_INCOME_MIN_NGN = 250_000

export const LEVEL_RANK_GATES = {
  C: { raidsSigned: 3 },
  B: {
    raidsSigned: 4,
    huntsLogged: 30,
    monthlyIncomeMinNgn: B_MONTHLY_INCOME_MIN_NGN,
  },
  A: { raidsSigned: 6, dungeonsCompleted: 2 },
  S: { raidsSigned: 10, dungeonsCompleted: 5, streakPeak: 30 },
}

export const LEVEL_RANK_GATES_LEGACY = LEVEL_RANK_GATES
export const RANK_GATES = LEVEL_RANK_GATES
