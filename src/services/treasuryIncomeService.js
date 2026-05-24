import { getAuthenticatedUserId, supabase } from '@/services/supabase'

export async function getTreasuryIncome() {
  const { data, error } = await supabase
    .from('treasury_income')
    .select('*')
    .order('expected_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createTreasuryIncome(payload) {
  const userId = await getAuthenticatedUserId()

  const { data, error } = await supabase
    .from('treasury_income')
    .insert({
      user_id: userId,
      client_id: payload.clientId || null,
      amount: payload.amount,
      expected_date: payload.expectedDate || null,
      received_date: payload.receivedDate || null,
      status: payload.status,
      description: payload.description || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateTreasuryIncomeStatus(payload) {
  const nextReceivedDate =
    payload.status === 'received'
      ? payload.receivedDate || new Date().toISOString().slice(0, 10)
      : payload.receivedDate || null

  const { data, error } = await supabase
    .from('treasury_income')
    .update({
      status: payload.status,
      received_date: nextReceivedDate,
    })
    .eq('id', payload.id)
    .select('*')
    .single()

  if (error) throw error
  return data
}