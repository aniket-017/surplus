import { CONDITION_OPTIONS, PRICE_TYPE_OPTIONS } from './productConstants'

export function formatPrice(value) {
  return `₹${value.toLocaleString('en-IN')}`
}

export function formatListingPrice(product) {
  const amount = formatPrice(product.price)

  if (product.priceType === 'per_kg') return `${amount} / kg`
  if (product.priceType === 'per_unit') return `${amount} / ${product.quantityUnit || 'unit'}`
  if (product.priceType === 'per_lot') return `${amount} / lot`
  if (product.priceType === 'negotiable') return `${amount} · Negotiable`

  return amount
}

export function formatLocationShort(location) {
  return `${location.city}, ${location.state}`
}

export function formatLabel(value) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getPriceTypeLabel(priceType) {
  return PRICE_TYPE_OPTIONS.find((option) => option.value === priceType)?.label ?? formatLabel(priceType)
}

export function getConditionLabel(condition) {
  return CONDITION_OPTIONS.find((option) => option.value === condition)?.label ?? formatLabel(condition)
}

export function formatAttributeKey(key) {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getCategoryEmoji(category) {
  const key = category.toLowerCase()

  if (key.includes('metal')) return '🔩'
  if (key.includes('plastic')) return '🧱'
  if (key.includes('paper')) return '📄'
  if (key.includes('electronic')) return '💻'
  if (key.includes('machin')) return '⚙️'
  if (key.includes('pipe')) return '🔧'

  return '📦'
}
