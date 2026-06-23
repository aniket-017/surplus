const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4369';

export function getCategoryImagePath(categoryName: string) {
  return `/api/assets/categories/${encodeURIComponent(`${categoryName}.png`)}`;
}

export function resolveCategoryImageUrl(
  category: string | { name: string; imageUrl?: string | null },
  imageUrl?: string | null,
) {
  const explicit = imageUrl ?? (typeof category === 'object' ? category.imageUrl : undefined);

  if (explicit) {
    if (explicit.startsWith('http')) {
      return explicit;
    }

    return `${API_BASE}${explicit}`;
  }

  const name = typeof category === 'string' ? category : category.name;
  return `${API_BASE}${getCategoryImagePath(name)}`;
}
