import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import {
  getCurrentPeriodQuests,
  getCurrentWeekDailyQuests,
  getQuestLog,
  getQuestsForAssignedDate,
  getRecallQuestsForToday,
} from '@/services/questService'
import { useProfile } from '@/hooks/useProfile'
import { getProfileTimezone, getTodayYmdInTimezone } from '@/utils/questTimezone'

export function useDailyQuests() {
  const profileQuery = useProfile()
  const tz = getProfileTimezone(profileQuery.data)

  return useQuery({
    queryKey: [...QUERY_KEYS.dailyQuests, tz],
    queryFn: async () => {
      const today = getTodayYmdInTimezone(tz)
      const rows = await getQuestsForAssignedDate(today, 'daily')
      return rows.filter((q) => !q.is_micro)
    },
    enabled: !!profileQuery.data,
  })
}

export function useRecallQuests() {
  const profileQuery = useProfile()
  const tz = getProfileTimezone(profileQuery.data)

  return useQuery({
    queryKey: [...QUERY_KEYS.dailyQuests, 'recall', tz],
    enabled: !!profileQuery.data,
    queryFn: async () => {
      const today = getTodayYmdInTimezone(tz)
      return getRecallQuestsForToday(today)
    },
  })
}

export function useWeeklyQuests() {
  return useQuery({
    queryKey: QUERY_KEYS.weeklyQuests,
    queryFn: async () => {
      const rows = await getCurrentWeekDailyQuests()
      return rows.filter((q) => q.analysis_snapshot?.weekly_session)
    },
  })
}

export function useQuestLog(periodFilter) {
  return useQuery({
    queryKey: [...QUERY_KEYS.questLog, periodFilter ?? 'all'],
    queryFn: () => getQuestLog(periodFilter),
  })
}
