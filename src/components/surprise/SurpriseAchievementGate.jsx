import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SurprisePendingOverlay } from '@/components/surprise/SurprisePendingOverlay'
import { SystemSurpriseModal } from '@/components/surprise/SystemSurpriseModal'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { useAuthSession } from '@/hooks/useAuthSession'
import { syncSessionAchievements } from '@/services/sessionAchievementSync'
import { subscribeSurprisePending } from '@/utils/surprisePending'
import { drainSurprises, subscribeSurprises } from '@/utils/surpriseQueue'

export function SurpriseAchievementGate() {
  const { user, isAuthenticated, isLoading } = useAuthSession()
  const queryClient = useQueryClient()
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)

  const refreshQueue = useCallback(() => {
    const items = drainSurprises()
    if (!items.length) return
    setQueue((prev) => [...prev, ...items])
  }, [])

  useEffect(() => {
    return subscribeSurprisePending(setPendingCount)
  }, [])

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.id) return undefined

    let cancelled = false

    syncSessionAchievements(user.id).then(() => {
      if (!cancelled) refreshQueue()
    })

    refreshQueue()
    const unsubscribe = subscribeSurprises(refreshQueue)

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [isAuthenticated, isLoading, refreshQueue, user?.id])

  useEffect(() => {
    if (current || !queue.length) return
    setCurrent(queue[0])
    setQueue((prev) => prev.slice(1))
  }, [current, queue])

  const handleClose = () => {
    setCurrent(null)
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.achievements })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
  }

  const showPending = pendingCount > 0 || (queue.length > 0 && !current)

  return (
    <>
      <SurprisePendingOverlay open={showPending && !current} />
      <SystemSurpriseModal open={Boolean(current)} surprise={current} onClose={handleClose} />
    </>
  )
}
