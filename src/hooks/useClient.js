import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getClientById } from '@/services/clientService'

export function useClient(clientId) {
  return useQuery({
    queryKey: [...QUERY_KEYS.clients, 'detail', clientId],
    queryFn: () => getClientById(clientId),
    enabled: Boolean(clientId),
  })
}
