import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getMilestonesForSkill } from '@/services/skillMilestoneService'

export function useSkillMilestones(skillId) {
  return useQuery({
    queryKey: [...QUERY_KEYS.skillMilestones, skillId],
    queryFn: () => getMilestonesForSkill(skillId),
    enabled: Boolean(skillId),
  })
}
