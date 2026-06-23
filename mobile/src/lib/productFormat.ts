import type { ProductCategory, ProductListing } from '@/src/types/product';
import { PRODUCT_CATEGORIES } from '@/src/types/product';

const CATEGORY_ICON_BY_NAME = new Map<string, string>(
  PRODUCT_CATEGORIES.map((item) => [item.name, item.icon]),
);

export function formatPrice(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function getProductTotalValue(
  product: Pick<ProductListing, 'price' | 'priceType' | 'quantity'>,
) {
  if (
    product.priceType === 'per_kg' ||
    product.priceType === 'per_unit' ||
    product.priceType === 'per_lot'
  ) {
    return product.price * product.quantity;
  }

  return product.price;
}

export function getSellerEstimatedValue(
  products: Pick<ProductListing, 'price' | 'priceType' | 'quantity'>[],
) {
  return products.reduce((sum, product) => sum + getProductTotalValue(product), 0);
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
  const exact = CATEGORY_ICON_BY_NAME.get(category);
  if (exact) return exact;

  const key = category.toLowerCase();

  if (key.includes('metal')) return 'construct-outline';
  if (key.includes('plastic') || key.includes('polymer')) return 'cube-outline';
  if (key.includes('pipe') || key.includes('tube') || key.includes('piping')) return 'git-branch-outline';
  if (key.includes('machin')) return 'cog-outline';
  if (key.includes('electronic') || key.includes('electrical')) return 'hardware-chip-outline';
  if (key.includes('chemical')) return 'flask-outline';
  if (key.includes('rubber')) return 'ellipse-outline';
  if (key.includes('packag')) return 'albums-outline';
  if (key.includes('construct') || key.includes('cement')) return 'home-outline';
  if (key.includes('textile') || key.includes('fabric')) return 'grid-outline';
  if (key.includes('wood') || key.includes('agro')) return 'leaf-outline';
  if (key.includes('mineral') || key.includes('ore')) return 'barbell-outline';
  if (key.includes('energy') || key.includes('solar') || key.includes('fuel')) return 'flash-outline';
  if (key.includes('safety') || key.includes('ppe')) return 'shield-outline';
  if (key.includes('paper')) return 'document-text-outline';

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
