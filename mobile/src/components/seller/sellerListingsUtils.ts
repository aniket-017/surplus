import type { Product, ProductCondition } from '@/src/types/product';

import type { SellerListingFilter } from './SellerListingStatusTabs';

function getListingStatus(product: Product) {
  return product.listingStatus ?? 'active';
}

export function getSellerListingCounts(products: Product[]) {
  const active = products.filter(
    (product) => getListingStatus(product) === 'active' && product.condition !== 'surplus',
  ).length;
  const surplus = products.filter(
    (product) => getListingStatus(product) === 'active' && product.condition === 'surplus',
  ).length;
  const sold = products.filter((product) => getListingStatus(product) === 'sold').length;

  return {
    all: products.length,
    active,
    sold,
    surplus,
  };
}

export function filterSellerListings(
  products: Product[],
  filter: SellerListingFilter,
  searchQuery: string,
) {
  const query = searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    const status = getListingStatus(product);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && status === 'active' && product.condition !== 'surplus') ||
      (filter === 'surplus' && status === 'active' && product.condition === 'surplus') ||
      (filter === 'sold' && status === 'sold');

    if (!matchesFilter) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      product.title,
      product.category,
      product.subCategory,
      product.description,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function getConditionFilterLabel(condition: ProductCondition) {
  if (condition === 'surplus') return 'Surplus';
  return 'Active';
}
