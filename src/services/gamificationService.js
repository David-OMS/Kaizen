import { collectAchievementMetrics, getAchievementTitlesToUnlock } from '@/services/achievementEvaluation'
import { ensureUserAchievements } from '@/services/achievementSeedService'
import { unlockAchievementByCatalogKey } from '@/services/achievementService'
import { shouldShowSurpriseForUnlock } from '@/utils/achievementEventScopes'

export { unlockLockedContentForRank } from '@/services/lockedContentService'

export async function runPostXpChecks({ eventType }) {
  await ensureUserAchievements()
  const metrics = await collectAchievementMetrics()
  const catalogKeys = getAchievementTitlesToUnlock(metrics, eventType)

  const unlocked = []

  for (const catalogKey of catalogKeys) {
    const showSurprise = shouldShowSurpriseForUnlock(catalogKey, eventType)
    const row = await unlockAchievementByCatalogKey(catalogKey, { showSurprise })
    if (row) unlocked.push(row)
  }

  return unlocked
}

export async function runRankSurpriseChecks() {
  return runPostXpChecks({ eventType: 'rank_sync' })
}
