import { runPostXpChecks } from '@/services/gamificationService'
import { ensureUserAchievements } from '@/services/achievementSeedService'
import { waitUntilAuthReady } from '@/utils/safeSupabaseMetrics'

const inFlightByUser = new Map()

export function getSessionSyncStorageKey(userId) {
  return `oms-surprise-sync-v4-${userId}`
}

function logSyncError(error) {
  const message = error?.message ?? String(error)
  const details = error?.details ?? error?.hint ?? ''
  console.error('[syncSessionAchievements]', message, details || error)
}

/**
 * Runs once per browser session after login. Retries if a prior attempt failed
 * (storage is only set after a successful sync).
 */
export async function syncSessionAchievements(userId) {
  if (!userId) return []

  if (typeof window !== 'undefined') {
    const doneKey = getSessionSyncStorageKey(userId)
    if (sessionStorage.getItem(doneKey)) return []
  }

  const existing = inFlightByUser.get(userId)
  if (existing) return existing

  const promise = (async () => {
    await waitUntilAuthReady()
    await ensureUserAchievements()
    const unlocked = await runPostXpChecks({ eventType: 'session_sync' })

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(getSessionSyncStorageKey(userId), '1')
    }

    return unlocked
  })()
    .catch((error) => {
      logSyncError(error)
      return []
    })
    .finally(() => {
      inFlightByUser.delete(userId)
    })

  inFlightByUser.set(userId, promise)
  return promise
}
