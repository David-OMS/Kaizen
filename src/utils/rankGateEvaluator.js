import {
  B_INCOME_GATE_ENABLED,
  LEVEL_RANK_GATES,
  RANK_ORDER,
} from '@/constants/xpEngine'

function meetsMinimum(actual, minimum) {
  return Number(actual || 0) >= Number(minimum || 0)
}

export function evaluateRankGate(rankKey, metrics) {
  const gate = LEVEL_RANK_GATES[rankKey]
  if (!gate) return { passed: true, unmet: [] }

  const checks = [
    {
      metric: 'raidsSigned',
      minimum: gate.raidsSigned,
      passed: gate.raidsSigned == null || meetsMinimum(metrics.raidsSigned, gate.raidsSigned),
    },
    {
      metric: 'huntsLogged',
      minimum: gate.huntsLogged,
      passed: gate.huntsLogged == null || meetsMinimum(metrics.huntsLogged, gate.huntsLogged),
    },
    {
      metric: 'dungeonsCompleted',
      minimum: gate.dungeonsCompleted,
      passed:
        gate.dungeonsCompleted == null || meetsMinimum(metrics.dungeonsCompleted, gate.dungeonsCompleted),
    },
    {
      metric: 'streakPeak',
      minimum: gate.streakPeak,
      passed: gate.streakPeak == null || meetsMinimum(metrics.streakPeak, gate.streakPeak),
    },
    {
      metric: 'monthlyIncomeMinNgn',
      minimum: gate.monthlyIncomeMinNgn,
      passed:
        gate.monthlyIncomeMinNgn == null ||
        !B_INCOME_GATE_ENABLED ||
        meetsMinimum(metrics.monthlyIncomeNgn, gate.monthlyIncomeMinNgn),
    },
  ]
    .filter((c) => c.minimum != null)
    .filter((c) => !c.passed)

  return {
    passed: checks.length === 0,
    unmet: checks,
  }
}

export function rankIndex(rankKey) {
  return RANK_ORDER.indexOf(rankKey)
}

/** Lower index = lower rank. Returns the lower of two rank keys. */
export function minRank(a, b) {
  const ia = rankIndex(a)
  const ib = rankIndex(b)
  if (ia < 0) return b
  if (ib < 0) return a
  return ia <= ib ? a : b
}

export function applyRankCap(candidateRank, rankCap) {
  if (!rankCap) return candidateRank
  return minRank(candidateRank, rankCap)
}
