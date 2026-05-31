import { useMemo, useState } from 'react'
import { DailyQuestBriefingModal } from '@/components/quest/DailyQuestBriefingModal'
import { getDailyBriefingStorageKey } from '@/constants/systemQuest'
import { QUEST_STATUS } from '@/constants/questLifecycle'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useProfile } from '@/hooks/useProfile'
import { useDailyQuests } from '@/hooks/useQuests'
import { getProfileTimezone, getTodayYmdInTimezone } from '@/utils/questTimezone'

const OPEN = [
  QUEST_STATUS.ACTIVE,
  QUEST_STATUS.EXTENDED,
  QUEST_STATUS.INCOMPLETE,
  QUEST_STATUS.ASSESSMENT_PENDING,
]

export function DailyQuestBriefingGate() {
  const { user } = useAuthSession()
  const profileQuery = useProfile()
  const dailyQuery = useDailyQuests()
  const [lsVersion, setLsVersion] = useState(0)

  const ymd = profileQuery.data
    ? getTodayYmdInTimezone(getProfileTimezone(profileQuery.data))
    : null
  const storageKey = user?.id && ymd ? getDailyBriefingStorageKey(user.id, ymd) : null

  const dismissed = useMemo(() => {
    if (!storageKey || typeof window === 'undefined') return false
    return Boolean(localStorage.getItem(storageKey))
  }, [storageKey, lsVersion])

  const activeCount = useMemo(
    () => (dailyQuery.data ?? []).filter((q) => OPEN.includes(q.status)).length,
    [dailyQuery.data],
  )

  const ready =
    Boolean(user?.id) &&
    Boolean(profileQuery.data) &&
    !dailyQuery.isLoading &&
    !dailyQuery.isError &&
    activeCount > 0

  const open = ready && !dismissed

  const onClose = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, '1')
      setLsVersion((v) => v + 1)
    }
  }

  return <DailyQuestBriefingModal open={open} onClose={onClose} />
}
