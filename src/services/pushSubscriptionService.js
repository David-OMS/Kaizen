import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { subscriptionToRow, urlBase64ToUint8Array } from '@/utils/pushSubscription'

export function pushBlockReason() {
  if (typeof window === 'undefined') return 'not_browser'
  if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) return 'missing_vapid_key'
  if (!window.isSecureContext) return 'insecure_context'
  if (!('serviceWorker' in navigator)) return 'no_service_worker'
  if (!('PushManager' in window)) return 'no_push_manager'
  if (!('Notification' in window)) return 'no_notification_api'
  return null
}

export function isPushSupported() {
  return pushBlockReason() === null
}

export async function subscribeToPushNotifications() {
  const block = pushBlockReason()
  if (block) throw new Error(block)

  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: permission }

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    })
  }

  const userId = await getAuthenticatedUserId()
  const row = subscriptionToRow(sub)

  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: userId, ...row, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  if (error) throw error
  return { ok: true }
}
