import { useEffect, useMemo, useState } from 'react'
import { DailyBrainTeaserModal } from '@/components/home/DailyBrainTeaserModal'
import { getBrainTeaserDismissKey } from '@/constants/brainTeaser'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useProfile } from '@/hooks/useProfile'
import { ensureDailyBrainTeaser, hasBrainTeaserForToday } from '@/services/brainTeaserService'
import { getProfileTimezone, getTodayYmdInTimezone } from '@/utils/questTimezone'

export function DailyBrainTeaserGate() {
  const { user } = useAuthSession()
  const profileQuery = useProfile()
  const [lsVersion, setLsVersion] = useState(0)
  const profile = profileQuery.data
  const ymd = profile ? getTodayYmdInTimezone(getProfileTimezone(profile)) : null
  const storageKey = user?.id && ymd ? getBrainTeaserDismissKey(user.id, ymd) : null

  const dismissed = useMemo(() => {
    if (!storageKey || typeof window === 'undefined') return false
    return Boolean(localStorage.getItem(storageKey))
  }, [storageKey, lsVersion])

  useEffect(() => {
    if (!profile || profileQuery.isLoading) return
    const today = getTodayYmdInTimezone(getProfileTimezone(profile))
    if (hasBrainTeaserForToday(profile, today)) return

    let cancelled = false
    ensureDailyBrainTeaser(profile)
      .then(() => {
        if (!cancelled) profileQuery.refetch()
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [profile, profileQuery.isLoading, profileQuery.refetch])

  const fact = profile?.daily_brain_teaser_fact
  const ready =
    Boolean(user?.id) &&
    Boolean(profile) &&
    Boolean(fact) &&
    hasBrainTeaserForToday(profile, ymd) &&
    !profileQuery.isLoading

  const open = ready && !dismissed

  const onClose = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, '1')
      setLsVersion((v) => v + 1)
    }
  }

  return <DailyBrainTeaserModal open={open} fact={fact} onClose={onClose} />
}
