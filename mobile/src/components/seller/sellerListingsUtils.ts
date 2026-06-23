import type { Product, ProductCondition } from '@/src/types/product';

import type { SellerListingFilter } from './SellerListingStatusTabs';

export function getSellerListingCounts(products: Product[]) {
  const active = products.filter((product) => product.condition !== 'scrap').length;
  const scrap = products.filter((product) => product.condition === 'scrap').length;

  return {
    all: products.length,
    active,
    sold: 0,
    scrap,
  };
}

export function filterSellerListings(
  products: Product[],
  filter: SellerListingFilter,
  searchQuery: string,
) {
  const query = searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && product.condition !== 'scrap') ||
      (filter === 'scrap' && product.condition === 'scrap') ||
      (filter === 'sold' && false);

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
  if (condition === 'scrap') return 'Scrap';
  return 'Active';
}
