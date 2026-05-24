let pendingCount = 0
const pendingListeners = new Set()

export function beginSurprisePending() {
  pendingCount += 1
  pendingListeners.forEach((listener) => listener(pendingCount))
}

export function endSurprisePending() {
  pendingCount = Math.max(0, pendingCount - 1)
  pendingListeners.forEach((listener) => listener(pendingCount))
}

export function getSurprisePendingCount() {
  return pendingCount
}

export function subscribeSurprisePending(listener) {
  pendingListeners.add(listener)
  listener(pendingCount)
  return () => pendingListeners.delete(listener)
}
