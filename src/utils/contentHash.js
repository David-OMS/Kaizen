/** Browser SHA-256 hex for cache keys (matches Edge Function hashing). */

export async function sha256Hex(message) {
  const encoded = new TextEncoder().encode(message)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
