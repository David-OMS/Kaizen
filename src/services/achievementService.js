import { ACHIEVEMENT_KEYS, getAchievementDefByKey, getAchievementDefByLegacyTitle } from '@/constants/achievementCatalog'
import { invokeNameAchievement } from '@/services/aiAchievementNamingService'
import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { addXPBase } from '@/services/xpService'
import { enqueueSurprise } from '@/utils/surpriseQueue'
import { beginSurprisePending, endSurprisePending } from '@/utils/surprisePending'

export async function getAchievements() {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('unlocked', { ascending: true })
    .order('catalog_key', { ascending: true })

  if (error) throw error
  return data ?? []
}

async function resolveAchievementNaming(catalogKey, def) {
  const naming = await invokeNameAchievement({
    catalogKey,
    category: def.category,
    triggerHint: def.triggerHint,
  })

  return {
    title: naming.displayTitle,
    description: naming.displayTagline,
    naming_snapshot: {
      display_title: naming.displayTitle,
      display_tagline: naming.displayTagline,
      fallback_used: naming.fallbackUsed,
      variation_seed: naming.variationSeed,
      model: naming.model,
    },
  }
}

async function updateAchievementUnlock(achievement, patch) {
  const { naming_snapshot: namingSnapshot, ...rest } = patch

  const payload = { ...rest }
  if (namingSnapshot != null) {
    payload.naming_snapshot = namingSnapshot
  }

  const { data, error } = await supabase
    .from('achievements')
    .update(payload)
    .eq('id', achievement.id)
    .eq('unlocked', false)
    .select('*')
    .maybeSingle()

  if (error && namingSnapshot != null && isMissingColumnError(error)) {
    const { data: retryData, error: retryError } = await supabase
      .from('achievements')
      .update(rest)
      .eq('id', achievement.id)
      .eq('unlocked', false)
      .select('*')
      .maybeSingle()

    if (retryError) throw retryError
    return retryData
  }

  if (error) throw error
  return data
}

function isMissingColumnError(error) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('naming_snapshot') || message.includes('catalog_key')
}

export async function unlockAchievementByCatalogKey(catalogKey, options = {}) {
  const showSurprise = options.showSurprise !== false
  const def = getAchievementDefByKey(catalogKey)
  if (!def) return null

  const achievements = await getAchievements()
  const target = achievements.find((row) => row.catalog_key === catalogKey && !row.unlocked)
  if (!target) return null

  beginSurprisePending()
  try {
    const naming = await resolveAchievementNaming(catalogKey, def)
    const unlockTimestamp = new Date().toISOString()

    const updated = await updateAchievementUnlock(target, {
      unlocked: true,
      unlocked_at: unlockTimestamp,
      title: naming.title,
      description: naming.description,
      naming_snapshot: naming.naming_snapshot,
      manually_awarded: false,
    })

    if (!updated) return null

    if (Number(updated.xp_reward || 0) !== 0) {
      await addXPBase(
        Number(updated.xp_reward),
        'achievement_unlocked',
        `Achievement unlocked: ${updated.title}.`,
      )
    }

    if (showSurprise) {
      enqueueSurprise({
        ...updated,
        category: def.category,
        secret: def.secret !== false,
      })
    }

    return updated
  } finally {
    endSurprisePending()
  }
}

/** @deprecated — pass catalog key (e.g. ACHIEVEMENT_KEYS.FIRST_BLOOD) */
export async function unlockAchievementByTitle(titleOrKey) {
  const def = getAchievementDefByKey(titleOrKey) ?? getAchievementDefByLegacyTitle(titleOrKey)
  if (!def) return null
  return unlockAchievementByCatalogKey(def.key)
}

async function maybeUnlockBackfilledMeta() {
  const achievements = await getAchievements()
  const manuallyAwardedCount = achievements.filter((item) => item.manually_awarded).length
  if (manuallyAwardedCount !== 1) return

  const backfilled = achievements.find((item) => item.catalog_key === ACHIEVEMENT_KEYS.BACKFILLED)
  if (!backfilled || backfilled.unlocked) return
  await unlockAchievementByCatalogKey(ACHIEVEMENT_KEYS.BACKFILLED)
}

export async function manualAwardAchievement(payload) {
  const userId = await getAuthenticatedUserId()
  const { data: achievement, error: fetchError } = await supabase
    .from('achievements')
    .select('*')
    .eq('id', payload.id)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError

  if (!achievement.unlocked) {
    const catalogKey = achievement.catalog_key
    const def = catalogKey ? getAchievementDefByKey(catalogKey) : getAchievementDefByLegacyTitle(achievement.title)

    beginSurprisePending()
    try {
      const naming = def
        ? await resolveAchievementNaming(def.key, def)
        : {
            title: achievement.title,
            description: achievement.description || 'Manually awarded.',
            naming_snapshot: null,
          }

      const unlockTimestamp = payload.manualDateOverride
        ? new Date(`${payload.manualDateOverride}T00:00:00.000Z`).toISOString()
        : new Date().toISOString()

      const updated = await updateAchievementUnlock(achievement, {
        unlocked: true,
        unlocked_at: unlockTimestamp,
        title: naming.title,
        description: naming.description,
        naming_snapshot: naming.naming_snapshot,
        manually_awarded: true,
        manual_date_override: payload.manualDateOverride ?? null,
      })

      if (Number(updated.xp_reward || 0) !== 0) {
        await addXPBase(
          Number(updated.xp_reward),
          'achievement_unlocked',
          `Achievement manually awarded: ${updated.title}.`,
        )
      }

      enqueueSurprise({
        ...updated,
        category: def?.category,
        secret: def?.secret !== false,
      })
    } finally {
      endSurprisePending()
    }
  }

  await maybeUnlockBackfilledMeta()
}
