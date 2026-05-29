import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { markCuriosityBookComplete } from '@/services/curiosityRotationService'
import { updateProfileQuestFields } from '@/services/questService'
import { getTodayYmdInTimezone, getProfileTimezone } from '@/utils/questTimezone'
import { getCuriosityDisplayState } from '@/services/curiosityRotationService'

export function useCuriosityState(profile) {
  const tz = getProfileTimezone(profile)
  const today = getTodayYmdInTimezone(tz)
  return getCuriosityDisplayState(profile ?? {}, today)
}

export function useCuriosityMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyQuests })
  }

  const completeBook = useMutation({
    mutationFn: (profile) => markCuriosityBookComplete(profile),
    onSuccess: invalidate,
  })

  const setEnabled = useMutation({
    mutationFn: (enabled) => updateProfileQuestFields({ curiosity_enabled: enabled }),
    onSuccess: invalidate,
  })

  const refreshThemes = useMutation({
    mutationFn: async (profile) => {
      const { invokePickCuriosityThemes } = await import('@/services/curiosityAiService')
      const booksDone = profile.curiosity_books_done ?? []
      const countriesDone = profile.curiosity_countries_done ?? []
      const professionsDone = profile.curiosity_professions_done ?? []
      const picked = await invokePickCuriosityThemes({
        pick: 'all',
        booksDone,
        countriesDone,
        professionsDone,
        profile,
      })
      return updateProfileQuestFields({
        curiosity_book_title: picked.book ?? profile.curiosity_book_title,
        curiosity_country: picked.country ?? profile.curiosity_country,
        curiosity_profession: picked.profession ?? profile.curiosity_profession,
      })
    },
    onSuccess: invalidate,
  })

  return { completeBook, setEnabled, refreshThemes }
}
