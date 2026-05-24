export function getCapacityPercentage(usedSlots, totalSlots) {
  if (!totalSlots || totalSlots <= 0) return 0
  return Math.min(100, Math.round((usedSlots / totalSlots) * 100))
}