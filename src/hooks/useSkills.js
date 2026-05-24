import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getSkills } from '@/services/skillsService'

export function useSkills() {
  return useQuery({
    queryKey: QUERY_KEYS.skills,
    queryFn: getSkills,
  })
}