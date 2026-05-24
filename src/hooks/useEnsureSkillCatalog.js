import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { ensureSkillCatalog } from '@/services/skillCatalogService'
import { useAuthSession } from '@/hooks/useAuthSession'

export function useEnsureSkillCatalog() {
  const { user } = useAuthSession()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ensureSkillCatalog,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.skills }),
  })

  useEffect(() => {
    if (!user?.id || mutation.isPending || mutation.isSuccess) return
    mutation.mutate()
  }, [user?.id, mutation.isPending, mutation.isSuccess])

  return mutation
}
