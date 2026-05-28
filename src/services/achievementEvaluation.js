import { ACHIEVEMENT_KEYS } from '@/constants/achievementCatalog'
import { HUNT_OUTCOME } from '@/constants/huntOutcomes'
import {
  TREASURY_EXPENSE_EVENT_COUNTS,
  TREASURY_INFLOW_EVENT_COUNTS,
  TREASURY_MONTH_HEAVY_EXPENSE_NGN,
  TREASURY_MONTH_PROFIT_MIN_NGN,
} from '@/constants/treasuryAchievements'
import { TREASURY_LIFETIME_TIERS, TREASURY_MONTH_TIERS } from '@/constants/treasuryMilestoneTiers'
import { RAID_BATTLE_STATUS } from '@/constants/raidBattleStatuses'
import { getProfile } from '@/services/profileService'
import { supabase } from '@/services/supabase'
import { getLocalMonthStartIso } from '@/utils/calendarMonth'
import { countOrZero, existsOrFalse, sumOrZero } from '@/utils/safeSupabaseMetrics'
import { filterAchievementKeysForEvent } from '@/utils/achievementEventScopes'

const HEAVY_SPOIL_NGN = 200_000
const MEGA_SPOIL_NGN = 1_000_000
const TREASURY_FLOOD_NGN = 1_000_000
const TREASURY_TSUNAMI_NGN = 50_000_000

const PENDING_HUNT_STATUSES = ['pending', 'no_reply', 'active']
const FINAL_HUNT_OUTCOMES = [
  HUNT_OUTCOME.SUCCESSFUL,
  HUNT_OUTCOME.REJECTED,
  HUNT_OUTCOME.GHOSTED,
  'engaged',
  'interested',
  'declined',
  'cold',
  'rejected',
]

export async function collectAchievementMetrics() {
  const [
    profile,
    huntTotal,
    huntSuccessful,
    huntRejected,
    huntGhosted,
    huntPending,
    huntFearPeak,
    raidTotal,
    raidActive,
    raidEverSigned,
    raidCompleted,
    spoilTotal,
    spoilHeavy,
    spoilMega,
    spoilSumNgn,
    recurringStreams,
    recurringClaims,
    treasuryInflowCount,
    treasuryLifetimeNgn,
    treasuryMonthNgn,
    treasuryOutstandingCount,
    expenseCount,
    expenseMonthNgn,
    weeklyClears,
    dailyClears,
    questFails,
    xpEventCount,
  ] = await Promise.all([
    getProfile(),
    countReachouts(),
    countReachoutsByStatus([HUNT_OUTCOME.SUCCESSFUL, 'engaged', 'interested']),
    countReachoutsByStatus([HUNT_OUTCOME.REJECTED, 'declined']),
    countReachoutsByStatus([HUNT_OUTCOME.GHOSTED, 'cold']),
    countReachoutsByStatus(PENDING_HUNT_STATUSES),
    countReachoutsFearAtLeast(5),
    countClients(),
    countClientsByRaidStatuses(['ongoing', 'active']),
    countClientsEverSigned(),
    countClientsByRaidStatuses(['completed', 'lost']),
    countSpoils(),
    hasSpoilAtLeast(HEAVY_SPOIL_NGN),
    hasSpoilAtLeast(MEGA_SPOIL_NGN),
    sumSpoilAmountsNgn(),
    countRecurringStreams(),
    countRecurringClaims(),
    countTreasuryInflowEvents(),
    sumTreasuryReceivedLifetimeNgn(),
    sumTreasuryReceivedThisMonthNgn(),
    countTreasuryOutstandingItems(),
    countTreasuryExpenses(),
    sumTreasuryExpensesThisMonthNgn(),
    countWeeklyQuestClears(),
    countDailyQuestClears(),
    countQuestFails(),
    countXpLogEvents(),
  ])

  const [raidC, raidB, raidA, raidS] = await Promise.all([
    countRaidsByRank('C'),
    countRaidsByRank('B'),
    countRaidsByRank('A'),
    countRaidsByRank('S'),
  ])

  const huntFinalized = await countReachoutsByStatus(FINAL_HUNT_OUTCOMES)

  const profileXp = Number(profile?.xp ?? 0)
  const profileLevel = Number(profile?.level ?? 1)

  return {
    profile,
    profileXp,
    profileLevel,
    huntTotal,
    huntSuccessful,
    huntRejected,
    huntGhosted,
    huntPending,
    huntFinalized,
    huntFearPeak,
    raidTotal,
    raidActive,
    raidEverSigned,
    raidCompleted,
    raidC,
    raidB,
    raidA,
    raidS,
    spoilTotal,
    spoilHeavy,
    spoilMega,
    spoilSumNgn,
    recurringStreams,
    recurringClaims,
    treasuryInflowCount,
    treasuryLifetimeNgn,
    treasuryMonthNgn,
    treasuryOutstandingCount,
    expenseCount,
    expenseMonthNgn,
    weeklyClears,
    dailyClears,
    questFails,
    xpEventCount,
  }
}

async function countXpLogEvents() {
  return countOrZero(() => supabase.from('xp_log').select('*', { count: 'exact', head: true }))
}

async function countReachouts() {
  return countOrZero(() => supabase.from('reachouts').select('*', { count: 'exact', head: true }))
}

async function countReachoutsByStatus(statuses) {
  return countOrZero(() =>
    supabase.from('reachouts').select('*', { count: 'exact', head: true }).in('response_status', statuses),
  )
}

async function countReachoutsFearAtLeast(level) {
  return countOrZero(() =>
    supabase.from('reachouts').select('*', { count: 'exact', head: true }).gte('fear_level', level),
  )
}

async function countClients() {
  return countOrZero(() => supabase.from('clients').select('*', { count: 'exact', head: true }))
}

async function countClientsByRaidStatuses(statuses) {
  return countOrZero(() =>
    supabase.from('clients').select('*', { count: 'exact', head: true }).in('status', statuses),
  )
}

async function countClientsEverSigned() {
  return countOrZero(() =>
    supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .in('status', ['ongoing', 'active', 'completed', 'lost']),
  )
}

async function countRaidsByRank(rank) {
  return countOrZero(() =>
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('raid_rank', rank),
  )
}

async function countSpoils() {
  return countOrZero(() => supabase.from('raid_spoils').select('*', { count: 'exact', head: true }))
}

async function hasSpoilAtLeast(amount) {
  return existsOrFalse(() =>
    supabase.from('raid_spoils').select('*', { count: 'exact', head: true }).gte('amount', amount),
  )
}

async function sumSpoilAmountsNgn() {
  return sumOrZero(() => supabase.from('raid_spoils').select('amount'))
}

async function countRecurringStreams() {
  return countOrZero(() => supabase.from('raid_recurring_streams').select('*', { count: 'exact', head: true }))
}

async function countRecurringClaims() {
  return countOrZero(() =>
    supabase
      .from('raid_recurring_accruals')
      .select('*', { count: 'exact', head: true })
      .not('claimed_at', 'is', null),
  )
}

async function countTreasuryInflowEvents() {
  const [spoils, claims] = await Promise.all([countSpoils(), countRecurringClaims()])
  return spoils + claims
}

async function sumCollectionEntryAmountsNgn() {
  return sumOrZero(() => supabase.from('treasury_collection_entries').select('amount'))
}

async function sumTreasuryReceivedLifetimeNgn() {
  const [spoils, tributes, collections] = await Promise.all([
    sumSpoilAmountsNgn(),
    sumClaimedAccrualAmountsNgn(),
    sumCollectionEntryAmountsNgn(),
  ])
  return spoils + tributes + collections
}

async function sumTreasuryReceivedThisMonthNgn() {
  const since = getLocalMonthStartIso()
  const [spoils, tributes] = await Promise.all([
    sumSpoilsSinceNgn(since),
    sumClaimedAccrualsSinceNgn(since),
  ])
  return spoils + tributes
}

async function sumClaimedAccrualAmountsNgn() {
  return sumOrZero(() =>
    supabase
      .from('raid_recurring_accruals')
      .select('amount')
      .not('claimed_at', 'is', null),
  )
}

async function sumSpoilsSinceNgn(sinceIso) {
  return sumOrZero(() => supabase.from('raid_spoils').select('amount').gte('recorded_at', sinceIso))
}

async function sumClaimedAccrualsSinceNgn(sinceIso) {
  return sumOrZero(() =>
    supabase
      .from('raid_recurring_accruals')
      .select('amount')
      .not('claimed_at', 'is', null)
      .gte('claimed_at', sinceIso),
  )
}

async function countTreasuryOutstandingItems() {
  const nowIso = new Date().toISOString()
  const [battles, tributes] = await Promise.all([
    countOrZero(() =>
      supabase
        .from('raid_battles')
        .select('*', { count: 'exact', head: true })
        .eq('status', RAID_BATTLE_STATUS.AWAITING_SPOIL),
    ),
    countOrZero(() =>
      supabase
        .from('raid_recurring_accruals')
        .select('*', { count: 'exact', head: true })
        .is('claimed_at', null)
        .lte('ready_at', nowIso),
    ),
  ])
  return battles + tributes
}

async function countTreasuryExpenses() {
  return countOrZero(() => supabase.from('treasury_expenses').select('*', { count: 'exact', head: true }))
}

async function sumTreasuryExpensesThisMonthNgn() {
  const since = getLocalMonthStartIso()
  return sumOrZero(() => supabase.from('treasury_expenses').select('amount').gte('date', since.slice(0, 10)))
}

async function countWeeklyQuestClears() {
  return countOrZero(() =>
    supabase
      .from('quest_log')
      .select('*', { count: 'exact', head: true })
      .eq('period', 'weekly')
      .eq('outcome', 'completed'),
  )
}

async function countDailyQuestClears() {
  return countOrZero(() =>
    supabase
      .from('quest_log')
      .select('*', { count: 'exact', head: true })
      .eq('period', 'daily')
      .eq('outcome', 'completed'),
  )
}

async function countQuestFails() {
  return countOrZero(() =>
    supabase.from('quest_log').select('*', { count: 'exact', head: true }).eq('outcome', 'failed'),
  )
}

/** Returns catalog keys eligible right now (before event filter). */
function computeEligibleAchievementKeys(metrics, eventType) {
  const keys = []
  const rank = String(metrics.profile.rank || 'E').toUpperCase()
  const streak = Number(metrics.profile.streak_current || 0)
  const streakBest = Number(metrics.profile.streak_best || 0)
  const capacity = Number(metrics.profile.capacity_slots_total || 0)
  const k = ACHIEVEMENT_KEYS

  const push = (catalogKey, condition) => {
    if (condition) keys.push(catalogKey)
  }

  const freshHunter =
    metrics.xpEventCount === 0 &&
    metrics.profileXp === 0 &&
    metrics.huntTotal === 0 &&
    metrics.raidTotal === 0 &&
    metrics.spoilTotal === 0

  push(k.RECORD_THIS_DOT_ZERO, freshHunter)

  push(k.OPENING_STRIKE, metrics.huntTotal >= 1)
  push(k.HUNT_MARK_5, metrics.huntTotal >= 5)
  push(k.TRIPLE_MARK, metrics.huntTotal >= 3)
  push(k.HUNT_MARK_25, metrics.huntTotal >= 25)
  push(k.FIELD_PRESSURE, metrics.huntTotal >= 10)
  push(k.THE_GRIND_BEGINS, metrics.huntTotal >= 10)
  push(k.HUNT_MARK_50, metrics.huntTotal >= 50)
  push(k.HUNT_MARK_100, metrics.huntTotal >= 100)
  push(k.HUNT_PENDING_STACK_3, metrics.huntPending >= 3)
  push(k.GREEN_LIGHT, metrics.huntSuccessful >= 1)
  push(k.IRON_WILL, metrics.huntRejected >= 1)
  push(k.GHOST_WALK, metrics.huntGhosted >= 1)
  push(k.REJECTION_RAIN, metrics.huntRejected >= 10)
  push(k.HUNDRED_REJECTIONS, metrics.huntRejected >= 100)
  push(k.FEAR_PEAK_FIRST, metrics.huntFearPeak >= 1)

  push(k.RAID_PIONEER, metrics.raidTotal >= 1)
  push(k.RAID_MARK_5, metrics.raidTotal >= 5)
  push(k.FIRST_BLOOD, metrics.raidEverSigned >= 1)
  push(k.DUAL_WIELDING, metrics.raidActive >= 2)
  push(k.TRIPLE_GATE, metrics.raidActive >= 3)
  push(k.TEN_DUNGEONS, metrics.raidTotal >= 10)
  push(k.RAID_MARK_25, metrics.raidTotal >= 25)
  push(k.RAID_MARK_50, metrics.raidTotal >= 50)
  push(k.FULL_CAPACITY, capacity > 0 && metrics.raidActive >= capacity)
  push(k.RANK_C_SIGIL, metrics.raidC >= 1)
  push(k.B_RANK_CONTRACT, metrics.raidB >= 1)
  push(k.A_RANK_LICENSE, metrics.raidA >= 1)
  push(k.S_RANK_WHISPER, metrics.raidS >= 1)
  push(k.DUNGEON_CLOSED, metrics.raidCompleted >= 1)
  push(k.RAID_DONE_5, metrics.raidCompleted >= 5)

  push(k.FIRST_SPOILS, metrics.spoilTotal >= 1)
  push(k.SPOIL_MARK_5, metrics.spoilTotal >= 5)
  push(k.SPOIL_HOARDER, metrics.spoilTotal >= 10)
  push(k.SPOIL_MARK_25, metrics.spoilTotal >= 25)
  push(k.SPOIL_MARK_50, metrics.spoilTotal >= 50)
  push(k.HEAVY_CHEST, metrics.spoilHeavy)
  push(k.MEGA_DROP, metrics.spoilMega)
  push(k.TRIBUTE_STREAM, metrics.recurringStreams >= 1)
  push(k.THREE_MOONS, metrics.recurringClaims >= 3)
  push(k.STREAM_STACK_5, metrics.recurringStreams >= 5)
  push(k.TRIBUTE_YEAR, metrics.recurringClaims >= 12)
  push(k.TREASURY_FLOOD, metrics.treasuryLifetimeNgn >= TREASURY_FLOOD_NGN)
  push(k.TREASURY_TSUNAMI, metrics.treasuryLifetimeNgn >= TREASURY_TSUNAMI_NGN)

  push(k.HUNTER_LICENSE, rankIndex(rank) >= rankIndex('D'))
  push(k.ARCHITECT_AWAKENED, rankIndex(rank) >= rankIndex('C'))
  push(k.FIELD_OPERATOR, rankIndex(rank) >= rankIndex('B'))
  push(k.GUILD_LEADER, rankIndex(rank) >= rankIndex('A'))
  push(k.SHADOW_MONARCH, rankIndex(rank) >= rankIndex('S'))
  push(k.XP_BURST_500, metrics.profileXp >= 500)
  push(k.XP_BURST_2500, metrics.profileXp >= 2500)
  push(k.XP_BURST_10000, metrics.profileXp >= 10000)
  push(k.XP_BURST_50000, metrics.profileXp >= 50000)
  push(k.LEVEL_BREAK_5, metrics.profileLevel >= 5)
  push(k.LEVEL_BREAK_10, metrics.profileLevel >= 10)
  push(k.LEVEL_BREAK_20, metrics.profileLevel >= 20)

  push(k.STREAK_EMBER_3, streak >= 3 || streakBest >= 3)
  push(k.CONSISTENT, streak >= 7 || streakBest >= 7)
  push(k.STREAK_INFERNO_14, streak >= 14 || streakBest >= 14)
  push(k.MONTH_OF_DISCIPLINE, streakBest >= 30)
  push(k.DAILY_CLEAR_5, metrics.dailyClears >= 5)
  push(k.DAILY_CLEAR_25, metrics.dailyClears >= 25)
  push(k.DAILY_CLEAR_100, metrics.dailyClears >= 100)
  push(k.WEEKLY_CLEAR, metrics.weeklyClears >= 1)
  push(k.WEEKLY_CLEAR_5, metrics.weeklyClears >= 5)
  push(k.WEEKLY_CLEAR_25, metrics.weeklyClears >= 25)
  push(k.QUEST_TAX, metrics.questFails >= 1)

  const monthNet = metrics.treasuryMonthNgn - metrics.expenseMonthNgn

  push(k.OPEN_ACCOUNT, metrics.treasuryInflowCount >= 1)
  push(k.INVOICE_RAIN_5, metrics.treasuryInflowCount >= TREASURY_INFLOW_EVENT_COUNTS.RAIN_5)
  push(k.INVOICE_RAIN_25, metrics.treasuryInflowCount >= TREASURY_INFLOW_EVENT_COUNTS.RAIN_25)
  push(k.INFLOW_RAIN_50, metrics.treasuryInflowCount >= TREASURY_INFLOW_EVENT_COUNTS.RAIN_50)
  push(k.INFLOW_RAIN_100, metrics.treasuryInflowCount >= TREASURY_INFLOW_EVENT_COUNTS.RAIN_100)
  for (const tier of TREASURY_LIFETIME_TIERS) {
    push(tier.key, metrics.treasuryLifetimeNgn >= tier.amountNgn)
  }
  for (const tier of TREASURY_MONTH_TIERS) {
    push(tier.key, metrics.treasuryMonthNgn >= tier.amountNgn)
  }
  push(
    k.TREASURY_ZERO_OUTSTANDING,
    metrics.treasuryInflowCount >= 1 && metrics.treasuryOutstandingCount === 0,
  )
  push(k.LEDGER_FIRST_DEBIT, metrics.expenseCount >= TREASURY_EXPENSE_EVENT_COUNTS.FIRST)
  push(k.LEDGER_DEBIT_5, metrics.expenseCount >= TREASURY_EXPENSE_EVENT_COUNTS.TRACKER_5)
  push(k.LEDGER_DEBIT_25, metrics.expenseCount >= TREASURY_EXPENSE_EVENT_COUNTS.TRACKER_25)
  push(k.TREASURY_HEAVY_MONTH, metrics.expenseMonthNgn >= TREASURY_MONTH_HEAVY_EXPENSE_NGN)
  push(
    k.TREASURY_PROFIT_MONTH,
    metrics.treasuryMonthNgn > 0 && monthNet >= TREASURY_MONTH_PROFIT_MIN_NGN,
  )

  if (eventType === 'monthly_review_logged') {
    push(k.MONTH_ONE, true)
  }

  return [...new Set(keys)]
}

/** Returns catalog keys to unlock for this specific XP event only. */
export function getAchievementTitlesToUnlock(metrics, eventType) {
  const eligible = computeEligibleAchievementKeys(metrics, eventType)
  return filterAchievementKeysForEvent(eligible, eventType)
}

function rankIndex(rank) {
  return 'ESDCBA'.indexOf(String(rank || 'E').toUpperCase())
}
