import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getCurrentPeriodQuests, getQuestLog, getQuestsForAssignedDate } from '@/services/questService'
import { useProfile } from '@/hooks/useProfile'
import { getProfileTimezone, getTodayYmdInTimezone } from '@/utils/questTimezone'

export function useDailyQuests() {
  const profileQuery = useProfile()
  const tz = getProfileTimezone(profileQuery.data)

  return useQuery({
    queryKey: [...QUERY_KEYS.dailyQuests, tz],
    queryFn: async () => {
      const today = getTodayYmdInTimezone(tz)
      return getQuestsForAssignedDate(today, 'daily')
    },
    enabled: !!profileQuery.data,
  })
}

export function useWeeklyQuests() {
  return useQuery({
    queryKey: QUERY_KEYS.weeklyQuests,
    queryFn: () => getCurrentPeriodQuests('weekly'),
  })
}

export function useQuestLog(periodFilter) {
  return useQuery({
    queryKey: [...QUERY_KEYS.questLog, periodFilter ?? 'all'],
    queryFn: () => getQuestLog(periodFilter),
  })
}
