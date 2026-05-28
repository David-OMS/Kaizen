import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { buildHabitProgress, claimSapienHabit, getSapienClaimsForDate } from '@/services/sapienClaimService'
import { getRecentSapienRewards } from '@/services/sapienMilestoneService'
import {
  createSapienHabit,
  deactivateSapienHabit,
  getSapienHabits,
  updateSapienHabit,
} from '@/services/sapienHabitService'
import { todayYmd } from '@/utils/sapienSchedule'

export function useSapienHabits() {
  return useQuery({
    queryKey: QUERY_KEYS.sapienHabits,
    queryFn: getSapienHabits,
  })
}

export function useSapienRewards() {
  return useQuery({
    queryKey: QUERY_KEYS.sapienRewards,
    queryFn: () => getRecentSapienRewards(12),
  })
}

export function useSapienToday() {
  const ymd = todayYmd()
  return useQuery({
    queryKey: QUERY_KEYS.sapienToday(ymd),
    queryFn: async () => {
      const [habits, claims] = await Promise.all([getSapienHabits(), getSapienClaimsForDate(ymd)])
      const rows = habits
        .map((habit) => ({
          habit,
          progress: buildHabitProgress(habit, claims, ymd),
        }))
        .filter((row) => row.progress.due)
      return { ymd, rows, allHabits: habits }
    },
  })
}

function invalidateSapien(queryClient) {
  const ymd = todayYmd()
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sapienHabits })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sapienToday(ymd) })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sapienRewards })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
}

export function useSapienMutations() {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: createSapienHabit,
    onSuccess: () => invalidateSapien(queryClient),
  })

  const update = useMutation({
    mutationFn: ({ id, patch }) => updateSapienHabit(id, patch),
    onSuccess: () => invalidateSapien(queryClient),
  })

  const remove = useMutation({
    mutationFn: deactivateSapienHabit,
    onSuccess: () => invalidateSapien(queryClient),
  })

  const claim = useMutation({
    mutationFn: claimSapienHabit,
    onSuccess: () => invalidateSapien(queryClient),
  })

  return { create, update, remove, claim }
}
