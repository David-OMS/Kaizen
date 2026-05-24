import { RANK_GATES } from '@/constants/gamification'

function hasMinimum(actual, minimum) {
  return Number(actual || 0) >= Number(minimum || 0)
}

export function evaluateRankGate(rankKey, metrics) {
  const gate = RANK_GATES[rankKey]
  if (!gate) {
    return { passed: true, unmet: [] }
  }

  const checks = [
    {
      metric: 'raidsSigned',
      minimum: gate.raidsSigned,
      passed: gate.raidsSigned == null || hasMinimum(metrics.raidsSigned, gate.raidsSigned),
    },
    {
      metric: 'huntsLogged',
      minimum: gate.huntsLogged,
      passed: gate.huntsLogged == null || hasMinimum(metrics.huntsLogged, gate.huntsLogged),
    },
    {
      metric: 'dungeonsCompleted',
      minimum: gate.dungeonsCompleted,
      passed: gate.dungeonsCompleted == null || hasMinimum(metrics.dungeonsCompleted, gate.dungeonsCompleted),
    },
    {
      metric: 'streakPeak',
      minimum: gate.streakPeak,
      passed: gate.streakPeak == null || hasMinimum(metrics.streakPeak, gate.streakPeak),
    },
  ].filter((item) => item.minimum != null)

  const unmet = checks.filter((item) => !item.passed)
  return {
    passed: unmet.length === 0,
    unmet,
  }
}