import { supabase } from '@/services/supabase'
import { normalizeUsername } from '@/utils/auth'

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function signInWithPassword({ username, password }) {
  const normalizedUsername = normalizeUsername(username)
  const { data: email, error: lookupError } = await supabase.rpc('get_sign_in_email', {
    p_username: normalizedUsername,
  })

  if (lookupError) throw lookupError
  if (!email) throw new Error('Username not found. Sign up first.')

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUpWithUsername({ username, email, password }) {
  const normalizedUsername = normalizeUsername(username)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: normalizedUsername,
      },
    },
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}