/** VAPID public key (URL-safe base64) → Uint8Array for PushManager.subscribe */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i)
  return out
}

export function subscriptionToRow(subscription) {
  const json = subscription.toJSON()
  const keys = json.keys
  if (!keys?.p256dh || !keys?.auth) throw new Error('Invalid push subscription')
  return {
    endpoint: json.endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  }
}
