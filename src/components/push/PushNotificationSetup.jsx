import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthSession } from '@/hooks/useAuthSession'
import {
  isPushSupported,
  pushBlockReason,
  subscribeToPushNotifications,
} from '@/services/pushSubscriptionService'

const BLOCK_MESSAGES = {
  missing_vapid_key: 'Add VITE_VAPID_PUBLIC_KEY to .env and restart the dev server.',
  insecure_context:
    'On mobile you need HTTPS. Deploy to Vercel, or expose dev with a tunnel (ngrok / cloudflared) and open that https link on your phone.',
  no_service_worker: 'Service worker unavailable — hard refresh or use npm run preview.',
  no_push_manager: 'This browser does not support push.',
  no_notification_api: 'This browser does not support notifications.',
}

export function PushNotificationSetup() {
  const { user } = useAuthSession()
  const [permission, setPermission] = useState(
    () => (typeof Notification !== 'undefined' ? Notification.permission : 'denied'),
  )
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id || !isPushSupported() || permission !== 'granted' || done) return
    subscribeToPushNotifications()
      .then((r) => {
        if (r.ok) setDone(true)
      })
      .catch((e) => setError(e.message))
  }, [user?.id, permission, done])

  if (!user?.id || done) return null

  if (!isPushSupported()) {
    const reason = pushBlockReason()
    return (
      <div className="fixed bottom-20 left-4 right-4 z-40 rounded-sm border border-[#1E2530] bg-[#12161D] p-3 text-xs text-zinc-400 md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
        {BLOCK_MESSAGES[reason] || 'Notifications unavailable in this context.'}
      </div>
    )
  }

  if (permission === 'granted') {
    return error ? (
      <div className="fixed bottom-20 left-4 right-4 z-40 rounded-sm border border-[#FF4B4B]/40 bg-[#12161D] p-3 md:bottom-6 md:right-6 md:max-w-sm">
        <p className="text-xs text-zinc-300">Notification setup failed: {error}</p>
        <Button
          type="button"
          className="system-button mt-2 w-full text-[10px]"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setError(null)
            try {
              const result = await subscribeToPushNotifications()
              if (result.ok) setDone(true)
            } catch (e) {
              setError(e.message)
            } finally {
              setBusy(false)
            }
          }}
        >
          RETRY
        </Button>
      </div>
    ) : null
  }

  const enable = async () => {
    setBusy(true)
    setError(null)
    try {
      const result = await subscribeToPushNotifications()
      setPermission(Notification.permission)
      if (result.ok) setDone(true)
      else if (result.reason === 'denied') setError('Blocked in browser settings.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 rounded-sm border border-[#1E2530] bg-[#12161D] p-3 shadow-lg md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
      <p className="text-xs text-zinc-300">Enable alerts for daily quests and evening reminders.</p>
      {error ? <p className="mt-1 text-xs text-[#FF4B4B]">{error}</p> : null}
      <Button
        type="button"
        className="system-button mt-2 w-full text-[10px]"
        disabled={busy}
        onClick={enable}
      >
        <Bell className="mr-1 inline size-3" />
        {busy ? 'ENABLING…' : 'ENABLE NOTIFICATIONS'}
      </Button>
    </div>
  )
}
