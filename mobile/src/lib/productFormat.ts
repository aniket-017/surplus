import type { ProductCategory, ProductListing } from '@/src/types/product';

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
  if (key.includes('polymer') || key.includes('plastic')) return 'cube-outline';
  if (key.includes('paper')) return 'document-text-outline';
  if (key.includes('electronic') || key.includes('electrical')) return 'hardware-chip-outline';
  if (key.includes('machin')) return 'cog-outline';
  if (key.includes('pipe') || key.includes('tube')) return 'git-branch-outline';
  if (key.includes('chemical')) return 'flask-outline';
  if (key.includes('rubber')) return 'ellipse-outline';

  return 'layers-outline';
}

export function suggestCategoryIcon(name: string) {
  return getCategoryIcon(name);
}

export function resolveCategoryIcon(category: ProductCategory | string, icon?: string) {
  if (icon) return icon;
  if (typeof category !== 'string' && category.icon) return category.icon;
  return getCategoryIcon(typeof category === 'string' ? category : category.name);
}
