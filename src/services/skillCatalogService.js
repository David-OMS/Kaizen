import { SKILL_CATALOG } from '@/constants/skillCatalog'
import { getAuthenticatedUserId, supabase } from '@/services/supabase'

export async function ensureSkillCatalog() {
  const userId = await getAuthenticatedUserId()
  const { data: existing, error: fetchError } = await supabase
    .from('skills')
    .select('catalog_key')
    .eq('user_id', userId)

  if (fetchError) throw fetchError

  const have = new Set((existing ?? []).map((r) => r.catalog_key).filter(Boolean))
  const missing = SKILL_CATALOG.filter((c) => !have.has(c.key))
  if (!missing.length) return { inserted: 0 }

  const rows = missing.map((c) => ({
    user_id: userId,
    name: c.name,
    description: c.description,
    skill_type: c.track,
    catalog_key: c.key,
    xp: 0,
    level: 0,
    active: true,
    unlocked: false,
  }))

  const { error } = await supabase.from('skills').insert(rows)
  if (error) throw error
  return { inserted: rows.length }
}
