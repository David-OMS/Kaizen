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
  const [reopen, setReopen] = useState(false)
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

  const autoOpen = ready && !dismissed
  const open = autoOpen || (ready && reopen)

  const onClose = () => {
    if (reopen) {
      setReopen(false)
      return
    }
    if (storageKey) {
      localStorage.setItem(storageKey, '1')
      setLsVersion((v) => v + 1)
    }
  }

  return (
    <>
      {ready && dismissed && !open ? (
        <button
          type="button"
          onClick={() => setReopen(true)}
          className="fixed bottom-20 right-3 z-40 max-w-[11rem] rounded-sm border border-[#A855F7]/40 bg-[#12161D]/95 px-3 py-2 text-left shadow-lg backdrop-blur-sm transition hover:border-[#A855F7]/70"
        >
          <span className="block text-[10px] uppercase tracking-[0.2em] text-[#A855F7]">Cipher drop</span>
          <span className="mt-0.5 block text-[11px] text-zinc-400">Tap to read today&apos;s oddment</span>
        </button>
      ) : null}
      <DailyBrainTeaserModal open={open} fact={fact} onClose={onClose} dismissed={dismissed || reopen} />
    </>
  )
}
