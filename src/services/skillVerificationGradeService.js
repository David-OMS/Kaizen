import { getAuthenticatedUserId, supabase } from '@/services/supabase'

export async function hasPassedVerificationForArc(arcId) {
  await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('skill_verification_grades')
    .select('id')
    .eq('arc_id', arcId)
    .eq('passed', true)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}
