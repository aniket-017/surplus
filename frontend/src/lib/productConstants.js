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
