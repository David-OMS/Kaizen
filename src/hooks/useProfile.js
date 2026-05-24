import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getProfile } from '@/services/profileService'

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: getProfile,
  })
}