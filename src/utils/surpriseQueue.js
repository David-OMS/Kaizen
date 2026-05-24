const queue = []
const listeners = new Set()

export function enqueueSurprise(achievement) {
  if (!achievement) return
  queue.push(achievement)
  listeners.forEach((listener) => listener())
}

export function drainSurprises() {
  const items = [...queue]
  queue.length = 0
  return items
}

export function subscribeSurprises(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
