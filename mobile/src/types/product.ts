import type { UserAddress } from '@/src/types/auth';

export type ProductAttribute = {
  key: string;
  value: string;
};

/** Turn camelCase / snake_case keys into readable labels (outerDiameter → Outer Diameter). */
export function formatAttributeKey(key: string) {
  const trimmed = key.trim();
  if (!trimmed) return '';

  return trimmed
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function humanizeAttributes(attributes: ProductAttribute[]): ProductAttribute[] {
  return attributes.map((attribute) => ({
    key: formatAttributeKey(attribute.key),
    value: attribute.value.trim(),
  }));
}

export type ProductLocation = {
  address?: string | null;
  city: string;
  state: string;
  pincode: string;
};

export type PriceType = 'fixed' | 'negotiable' | 'per_kg' | 'per_unit' | 'per_lot';
export type ProductCondition = 'new' | 'used' | 'surplus' | 'refurbished';
export type ListingStatus = 'active' | 'sold' | 'deleted';

export type ProductAnalysis = {
  title: string;
  category: string;
  subCategory: string;
  categoryIcon: string;
  description: string;
  quantityUnit: string;
  attributes: ProductAttribute[];
};

export type Product = {
  id: string;
  sellerId: string;
  title: string;
  category: string;
  subCategory: string;
  description: string;
  quantity: number;
  quantityUnit: string;
  price: number;
  priceType: PriceType;
  condition: ProductCondition;
  listingStatus?: ListingStatus;
  images: string[];
  attributes: ProductAttribute[];
  location: ProductLocation;
  viewCount?: number;
  inquiryCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductSeller = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  memberSince?: string | null;
};

export type ProductListing = Product & {
  seller: ProductSeller | null;
};

export type ProductCategory = {
  name: string;
  count: number;
  icon: string;
  imageUrl?: string | null;
};

export type ProductSubCategory = {
  name: string;
  count: number;
};

export type BrowseSort = 'recent' | 'price_asc' | 'price_desc';

export type BrowseProductsParams = {
  search?: string;
  category?: string;
  subCategory?: string;
  sort?: BrowseSort;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition;
  negotiable?: boolean;
  limit?: number;
  skip?: number;
};

export type ProductFormValues = {
  title: string;
  category: string;
  subCategory: string;
  description: string;
  quantityUnit: string;
  quantity: string;
  price: string;
  priceType: PriceType;
  condition: ProductCondition;
  attributes: ProductAttribute[];
  location: ProductLocation;
};

export type LocalImage = {
  uri: string;
  name: string;
  type: string;
};

export const PRICE_TYPE_OPTIONS: { label: string; value: PriceType }[] = [
  { label: 'Fixed', value: 'fixed' },
  { label: 'Negotiable', value: 'negotiable' },
  { label: 'Per kg', value: 'per_kg' },
  { label: 'Per unit', value: 'per_unit' },
  { label: 'Per lot', value: 'per_lot' },
];

export const CONDITION_OPTIONS: { label: string; value: ProductCondition }[] = [
  { label: 'New', value: 'new' },
  { label: 'Used', value: 'used' },
  { label: 'Surplus', value: 'surplus' },
  { label: 'Refurbished', value: 'refurbished' },
];

export const PRODUCT_CATEGORIES = [
  { name: 'Metals', icon: 'construct-outline' },
  { name: 'Plastics', icon: 'cube-outline' },
  { name: 'Piping', icon: 'filter-outline' },
  { name: 'Machinery', icon: 'cog-outline' },
  { name: 'Electronics', icon: 'hardware-chip-outline' },
  { name: 'Chemicals', icon: 'flask-outline' },
  { name: 'Rubber', icon: 'ellipse-outline' },
  { name: 'Packaging', icon: 'albums-outline' },
  { name: 'Construction', icon: 'home-outline' },
  { name: 'Textiles', icon: 'shirt-outline' },
  { name: 'Wood & Agro', icon: 'leaf-outline' },
  { name: 'Minerals', icon: 'earth-outline' },
  { name: 'Energy', icon: 'flash-outline' },
  { name: 'Safety', icon: 'shield-outline' },
  { name: 'Others', icon: 'layers-outline' },
] as const;

export const PRODUCT_CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((item) => item.name);

export type ProductCategoryName = (typeof PRODUCT_CATEGORY_OPTIONS)[number];

export function isAllowedProductCategory(value: string): value is ProductCategoryName {
  return PRODUCT_CATEGORY_OPTIONS.includes(value as ProductCategoryName);
}

export const emptyProductForm = (): ProductFormValues => ({
  title: '',
  category: '',
  subCategory: '',
  description: '',
  quantityUnit: '',
  quantity: '',
  price: '',
  priceType: 'fixed',
  condition: 'surplus',
  attributes: [],
  location: {
    address: '',
    city: '',
    state: '',
    pincode: '',
  },
});

export function isCompleteLocation(location: Pick<ProductLocation, 'city' | 'state' | 'pincode'>) {
  return Boolean(location.city?.trim() && location.state?.trim() && location.pincode?.trim());
}

export function profileAddressToLocation(address: UserAddress): ProductLocation {
  return {
    address: address.address?.trim() || '',
    city: address.city.trim(),
    state: address.state.trim(),
    pincode: address.pincode.trim(),
  };
}

export function productToFormValues(product: Product): ProductFormValues {
  return {
    title: product.title,
    category: product.category,
    subCategory: product.subCategory,
    description: product.description,
    quantityUnit: product.quantityUnit,
    quantity: String(product.quantity),
    price: String(product.price),
    priceType: product.priceType,
    condition: product.condition,
    attributes: humanizeAttributes(product.attributes),
    location: {
      address: product.location.address ?? '',
      city: product.location.city,
      state: product.location.state,
      pincode: product.location.pincode,
    },
  };
}
