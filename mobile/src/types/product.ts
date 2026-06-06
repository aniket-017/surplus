export type ProductAttribute = {
  key: string;
  value: string;
};

export type ProductLocation = {
  address?: string | null;
  city: string;
  state: string;
  pincode: string;
};

export type PriceType = 'fixed' | 'negotiable' | 'per_kg' | 'per_unit' | 'per_lot';
export type ProductCondition = 'new' | 'used' | 'scrap' | 'refurbished';

export type ProductAnalysis = {
  title: string;
  category: string;
  subCategory: string;
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
  images: string[];
  attributes: ProductAttribute[];
  location: ProductLocation;
  createdAt: string;
  updatedAt: string;
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
  { label: 'Scrap', value: 'scrap' },
  { label: 'Refurbished', value: 'refurbished' },
];

export const emptyProductForm = (): ProductFormValues => ({
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
});
