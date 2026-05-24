import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from '@/context/AuthContext'
import { supabase } from '@/services/supabase'
import { getSession } from '@/services/authService'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    getSession()
      .then((nextSession) => {
        if (isMounted) setSession(nextSession)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    const { data } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.user),
      isLoading,
    }),
    [isLoading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}