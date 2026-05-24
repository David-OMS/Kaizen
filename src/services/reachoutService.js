import { HUNT_FEAR_DEFAULT } from '@/constants/fieldOptions'
import { HUNT_OUTCOME } from '@/constants/huntOutcomes'
import { getAuthenticatedUserId, supabase } from '@/services/supabase'

export async function getReachouts() {
  const { data, error } = await supabase
    .from('reachouts')
    .select('*')
    .order('date_sent', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createReachout(payload) {
  const userId = await getAuthenticatedUserId()

  const { data, error } = await supabase
    .from('reachouts')
    .insert({
      user_id: userId,
      contact_name: payload.contactName,
      company: payload.company || null,
      channel: payload.channel || null,
      date_sent: payload.dateSent,
      fear_level: payload.fearLevel ?? HUNT_FEAR_DEFAULT,
      response_status: HUNT_OUTCOME.PENDING,
      notes: payload.notes || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateReachoutStatus(payload) {
  const patch = {
    response_status: payload.responseStatus,
  }

  if (payload.notes !== undefined) {
    patch.notes = payload.notes ?? null
  }

  if (payload.outcomeNotes !== undefined) {
    patch.outcome_notes = payload.outcomeNotes?.trim() || null
  }

  const { data, error } = await supabase
    .from('reachouts')
    .update(patch)
    .eq('id', payload.id)
    .select('*')
    .single()

  if (error) throw error
  return data
}