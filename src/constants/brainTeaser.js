export const BRAIN_TEASER_MODAL_TITLE = 'Cipher drop'

export function getBrainTeaserDismissKey(userId, ymd) {
  return `soloLeveling.brainTeaser:${userId}:${ymd}`
}
