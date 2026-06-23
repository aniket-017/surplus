import { CONDITION_OPTIONS, PRICE_TYPE_OPTIONS, PRODUCT_CATEGORIES } from './productConstants'

const CATEGORY_ICON_BY_NAME = new Map(
  PRODUCT_CATEGORIES.map((item) => [item.name, item.icon]),
)

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

export function getCategoryIcon(category) {
  const exact = CATEGORY_ICON_BY_NAME.get(category)
  if (exact) return exact

  const key = String(category || '').toLowerCase()

  if (key.includes('metal')) return 'construct-outline'
  if (key.includes('plastic') || key.includes('polymer')) return 'cube-outline'
  if (key.includes('pipe') || key.includes('tube') || key.includes('piping')) return 'filter-outline'
  if (key.includes('machin')) return 'cog-outline'
  if (key.includes('electronic') || key.includes('electrical')) return 'hardware-chip-outline'
  if (key.includes('chemical')) return 'flask-outline'
  if (key.includes('rubber')) return 'ellipse-outline'
  if (key.includes('packag')) return 'albums-outline'
  if (key.includes('construct') || key.includes('cement')) return 'home-outline'
  if (key.includes('textile') || key.includes('fabric')) return 'shirt-outline'
  if (key.includes('wood') || key.includes('agro')) return 'leaf-outline'
  if (key.includes('mineral') || key.includes('ore')) return 'earth-outline'
  if (key.includes('energy') || key.includes('solar') || key.includes('fuel')) return 'flash-outline'
  if (key.includes('safety') || key.includes('ppe')) return 'shield-outline'
  if (key.includes('paper')) return 'document-text-outline'

  return 'layers-outline'
}

export function suggestCategoryIcon(name) {
  return getCategoryIcon(name)
}

export function resolveCategoryIcon(category, icon) {
  if (icon) return icon
  if (category && typeof category === 'object' && category.icon) return category.icon
  const name = typeof category === 'string' ? category : category?.name
  return getCategoryIcon(name)
}

/** @deprecated Use resolveCategoryIcon with CategoryIcon component */
export function getCategoryEmoji(category) {
  const icon = getCategoryIcon(category)
  const emojiMap = {
    'construct-outline': '🔩',
    'cube-outline': '🧱',
    'document-text-outline': '📄',
    'hardware-chip-outline': '💻',
    'cog-outline': '⚙️',
    'filter-outline': '🔧',
    'flask-outline': '🧪',
    'ellipse-outline': '⭕',
    'albums-outline': '📦',
    'home-outline': '🏗️',
    'shirt-outline': '🧵',
    'leaf-outline': '🌿',
    'earth-outline': '⛏️',
    'flash-outline': '⚡',
    'shield-outline': '🦺',
    'layers-outline': '📦',
  }

  return emojiMap[icon] || '📦'
}
