import { supabase } from '@/services/supabase'

export async function getXpLog(eventTypeFilter) {
  let query = supabase.from('xp_log').select('*').order('created_at', { ascending: false })

  if (eventTypeFilter) {
    query = query.eq('event_type', eventTypeFilter)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}