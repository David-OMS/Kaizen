import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { DailyQuestBriefingModal } from '@/components/quest/DailyQuestBriefingModal'
import { getDailyBriefingStorageKey } from '@/constants/systemQuest'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useDailyQuests } from '@/hooks/useQuests'

export function DailyQuestBriefingGate() {
  const { user } = useAuthSession()
  const dailyQuery = useDailyQuests()
  const [lsVersion, setLsVersion] = useState(0)

  const ymd = format(new Date(), 'yyyy-MM-dd')
  const storageKey = user?.id ? getDailyBriefingStorageKey(user.id, ymd) : null

  const dismissed = useMemo(() => {
    if (!storageKey || typeof window === 'undefined') return false
    return Boolean(localStorage.getItem(storageKey))
  }, [storageKey, lsVersion])

  const ready = Boolean(user?.id) && !dailyQuery.isLoading && !dailyQuery.isError

  const open = ready && !dismissed

  const onClose = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, '1')
      setLsVersion((v) => v + 1)
    }
  }

  return <DailyQuestBriefingModal open={open} onClose={onClose} />
}
