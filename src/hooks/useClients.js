import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getClients } from '@/services/clientService'

export function useClients(status) {
  return useQuery({
    queryKey: [...QUERY_KEYS.clients, status ?? 'all'],
    queryFn: () => getClients(status),
  })
}