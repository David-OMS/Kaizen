import { useEffect, useRef } from 'react'
import { useQuestProvision } from '@/hooks/useQuestProvision'
import { needsDailyProvision } from '@/services/questProvisionService'

/**
 * Runs client-side daily provision when cron missed and today's board is empty (after 05:00 local).
 */
export function useAutoDailyProvision(profile) {
  const provision = useQuestProvision()
  const startedRef = useRef(false)

  useEffect(() => {
    startedRef.current = false
  }, [profile?.id])

  useEffect(() => {
    if (!profile?.id || provision.isPending || provision.isSuccess) return
    if (startedRef.current) return

    let cancelled = false

    ;(async () => {
      try {
        const needed = await needsDailyProvision(profile)
        if (cancelled || !needed) return
        startedRef.current = true
        provision.mutate({})
      } catch {
        /* needsDailyProvision failed — leave board empty; user can retry via provision.error UI */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [profile, provision.isPending, provision.isSuccess, provision.mutate])

  return provision
}
