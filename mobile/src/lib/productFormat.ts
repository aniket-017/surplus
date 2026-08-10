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
  if (key.includes('pipe') || key.includes('tube') || key.includes('piping')) return 'filter-outline';
  if (key.includes('machin')) return 'cog-outline';
  if (key.includes('electronic') || key.includes('electrical')) return 'hardware-chip-outline';
  if (key.includes('chemical')) return 'flask-outline';
  if (key.includes('rubber')) return 'ellipse-outline';
  if (key.includes('packag')) return 'albums-outline';
  if (key.includes('construct') || key.includes('cement')) return 'home-outline';
  if (key.includes('textile') || key.includes('fabric')) return 'shirt-outline';
  if (key.includes('wood') || key.includes('agro')) return 'leaf-outline';
  if (key.includes('mineral') || key.includes('ore')) return 'earth-outline';
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

export function formatRelativeDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function formatListedDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

export function splitDescriptionBullets(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const byNewline = trimmed
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

  if (byNewline.length > 1) return byNewline;

  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  return sentences.length > 1 ? sentences : [trimmed];
}

export { formatAttributeKey, humanizeAttributes } from '@/src/types/product';

