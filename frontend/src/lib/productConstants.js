export const PRICE_TYPE_OPTIONS = [
  { label: 'Fixed', value: 'fixed' },
  { label: 'Negotiable', value: 'negotiable' },
  { label: 'Per kg', value: 'per_kg' },
  { label: 'Per unit', value: 'per_unit' },
  { label: 'Per lot', value: 'per_lot' },
]

export const CONDITION_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Used', value: 'used' },
  { label: 'Scrap', value: 'scrap' },
  { label: 'Refurbished', value: 'refurbished' },
]

export const PRODUCT_CATEGORIES = [
  { name: 'Metals', icon: 'construct-outline' },
  { name: 'Plastics', icon: 'cube-outline' },
  { name: 'Piping', icon: 'git-branch-outline' },
  { name: 'Machinery', icon: 'cog-outline' },
  { name: 'Electronics', icon: 'hardware-chip-outline' },
  { name: 'Chemicals', icon: 'flask-outline' },
  { name: 'Rubber', icon: 'ellipse-outline' },
  { name: 'Packaging', icon: 'albums-outline' },
  { name: 'Construction', icon: 'home-outline' },
  { name: 'Textiles', icon: 'grid-outline' },
  { name: 'Wood & Agro', icon: 'leaf-outline' },
  { name: 'Minerals', icon: 'barbell-outline' },
  { name: 'Energy', icon: 'flash-outline' },
  { name: 'Safety', icon: 'shield-outline' },
  { name: 'Others', icon: 'layers-outline' },
]

export const PRODUCT_CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((item) => item.name)

export function isAllowedProductCategory(value) {
  return PRODUCT_CATEGORY_OPTIONS.includes(value)
}

export function emptyProductForm() {
  return {
    title: '',
    category: '',
    subCategory: '',
    description: '',
    quantityUnit: '',
    quantity: '',
    price: '',
    priceType: 'fixed',
    condition: 'scrap',
    attributes: [],
    location: {
      address: '',
      city: '',
      state: '',
      pincode: '',
    },
  }
}

export function isCompleteLocation(location) {
  return Boolean(location.city?.trim() && location.state?.trim() && location.pincode?.trim())
}

export function profileAddressToLocation(address) {
  return {
    address: address.address?.trim() || '',
    city: address.city.trim(),
    state: address.state.trim(),
    pincode: address.pincode.trim(),
  }
}
