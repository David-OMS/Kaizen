/** Local calendar month start as ISO (treasury month buckets). */
export function getLocalMonthStartIso(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}
