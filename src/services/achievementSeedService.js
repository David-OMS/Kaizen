import { ACHIEVEMENT_DEFS, LEGACY_TITLE_TO_KEY } from '@/constants/achievementCatalog'
import { getAchievements } from '@/services/achievementService'
import { getAuthenticatedUserId, supabase } from '@/services/supabase'

const LOCKED_TITLE = 'Undiscovered'

async function backfillCatalogKeys(existing) {
  const needsKey = existing.filter((row) => !row.catalog_key && LEGACY_TITLE_TO_KEY[row.title])
  for (const row of needsKey) {
    const catalogKey = LEGACY_TITLE_TO_KEY[row.title]
    await supabase.from('achievements').update({ catalog_key: catalogKey }).eq('id', row.id)
  }
  await supabase.from('achievements').update({ catalog_key: 'RECORD_THIS_DOT_ZERO' }).eq('catalog_key', 'FIRST_WAKE')
}

export async function ensureUserAchievements() {
  const userId = await getAuthenticatedUserId()
  let existing = await getAchievements()
  await backfillCatalogKeys(existing)

  await supabase
    .from('achievements')
    .delete()
    .eq('user_id', userId)
    .eq('title', LOCKED_TITLE)
    .is('catalog_key', null)
    .eq('unlocked', false)

  existing = await getAchievements()
  const existingKeys = new Set(existing.map((row) => row.catalog_key).filter(Boolean))

  const rows = ACHIEVEMENT_DEFS.filter((def) => !existingKeys.has(def.key)).map((def) => ({
    user_id: userId,
    catalog_key: def.key,
    title: LOCKED_TITLE,
    description: '',
    xp_reward: def.xpReward,
  }))

  if (rows.length) {
    const { error } = await supabase.from('achievements').insert(rows)
    if (error) throw error
  }

  return getAchievements()
}
