export function getConvertedHuntIds(raids = []) {
  return new Set(
    raids
      .map((raid) => {
        const text = raid.notes ?? ''
        const match = text.match(/\[hunt:([a-z0-9-]+)\]/i)
        return match ? match[1] : null
      })
      .filter(Boolean),
  )
}