import type { PriceType, ProductListing } from '@/src/types/product';

export function formatPrice(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function formatListingPrice(product: Pick<ProductListing, 'price' | 'priceType' | 'quantityUnit'>) {
  const amount = formatPrice(product.price);

  if (product.priceType === 'per_kg') return `${amount} / kg`;
  if (product.priceType === 'per_unit') return `${amount} / ${product.quantityUnit || 'unit'}`;
  if (product.priceType === 'per_lot') return `${amount} / lot`;
  if (product.priceType === 'negotiable') return `${amount} · Negotiable`;

  return amount;
}

export function formatLocationShort(location: ProductListing['location']) {
  return `${location.city}, ${location.state}`;
}

export function getCategoryIcon(category: string) {
  const key = category.toLowerCase();

  if (key.includes('metal')) return 'construct-outline';
  if (key.includes('plastic')) return 'cube-outline';
  if (key.includes('paper')) return 'document-text-outline';
  if (key.includes('electronic')) return 'hardware-chip-outline';
  if (key.includes('machin')) return 'cog-outline';
  if (key.includes('pipe')) return 'git-branch-outline';

  return 'layers-outline';
}
