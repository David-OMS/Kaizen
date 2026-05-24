import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getSkillArcs } from '@/services/skillArcService'

export function useSkillArcs() {
  return useQuery({
    queryKey: QUERY_KEYS.skillArcs,
    queryFn: getSkillArcs,
  })
}
