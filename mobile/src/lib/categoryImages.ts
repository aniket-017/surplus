const CATEGORY_IMAGES = {
  Metals: require('@/assets/categories/metals.jpg'),
  Plastics: require('@/assets/categories/plastics.jpg'),
  Piping: require('@/assets/categories/piping.jpg'),
  Machinery: require('@/assets/categories/machinery.jpg'),
  Electronics: require('@/assets/categories/electronics.jpg'),
  Chemicals: require('@/assets/categories/chemicals.jpg'),
  Rubber: require('@/assets/categories/rubber.jpg'),
  Packaging: require('@/assets/categories/packaging.jpg'),
  Construction: require('@/assets/categories/construction.jpg'),
  Textiles: require('@/assets/categories/textiles.jpg'),
  'Wood & Agro': require('@/assets/categories/wood-agro.jpg'),
  Minerals: require('@/assets/categories/minerals.jpg'),
  Energy: require('@/assets/categories/energy.jpg'),
  Safety: require('@/assets/categories/safety.jpg'),
  Others: require('@/assets/categories/others.jpg'),
} as const;

export function getCategoryImageSource(name: string) {
  return CATEGORY_IMAGES[name as keyof typeof CATEGORY_IMAGES] ?? null;
}
