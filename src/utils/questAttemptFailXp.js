import { ATTEMPT_FAIL_MAX_REWARD_RATIO } from '@/constants/questAttemptFail'

export function clampAttemptFailXp({ aiXpDelta, reward, penalty }) {
  const maxReward = Math.round(Number(reward || 0) * ATTEMPT_FAIL_MAX_REWARD_RATIO)
  const minXp = -Math.abs(Number(penalty || 0))
  const raw = Number(aiXpDelta ?? minXp)
  return Math.min(maxReward, Math.max(minXp, Math.round(raw)))
}
