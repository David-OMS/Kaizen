import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getLockedContent } from '@/services/lockedContentService'

export function useLockedContent() {
  return useQuery({
    queryKey: QUERY_KEYS.lockedContent,
    queryFn: getLockedContent,
  })
}