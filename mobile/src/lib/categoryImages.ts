const CATEGORY_IMAGES = {
  Metals: require('@/assets/categories/metals.webp'),
  Plastics: require('@/assets/categories/plastics.webp'),
  Piping: require('@/assets/categories/piping.webp'),
  Machinery: require('@/assets/categories/machinery.webp'),
  Electronics: require('@/assets/categories/electronics.webp'),
  Chemicals: require('@/assets/categories/chemicals.webp'),
  Rubber: require('@/assets/categories/rubber.webp'),
  Packaging: require('@/assets/categories/packaging.webp'),
  Construction: require('@/assets/categories/construction.webp'),
  Textiles: require('@/assets/categories/textiles.webp'),
  'Wood & Agro': require('@/assets/categories/wood-agro.webp'),
  Minerals: require('@/assets/categories/minerals.webp'),
  Energy: require('@/assets/categories/energy.webp'),
  Safety: require('@/assets/categories/safety.webp'),
  Others: require('@/assets/categories/others.webp'),
} as const;

export function getCategoryImageSource(name: string) {
  return CATEGORY_IMAGES[name as keyof typeof CATEGORY_IMAGES] ?? null;
}
