import { getAuthenticatedUserId, supabase } from '@/services/supabase'

export async function getTreasuryExpenses() {
  const { data, error } = await supabase
    .from('treasury_expenses')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createTreasuryExpense(payload) {
  const userId = await getAuthenticatedUserId()

  const { data, error } = await supabase
    .from('treasury_expenses')
    .insert({
      user_id: userId,
      category: payload.category,
      amount: payload.amount,
      date: payload.date,
      description: payload.description || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}