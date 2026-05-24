export function formatMoneyNgn(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '—'
  return `₦${x.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
}
