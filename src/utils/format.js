export function formatCurrency(amount) {
  const x = Number(amount)
  if (!Number.isFinite(x)) return '-'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(x)
}

export function formatDate(dateText) {
  if (!dateText) return '-'
  return new Date(dateText).toLocaleDateString()
}