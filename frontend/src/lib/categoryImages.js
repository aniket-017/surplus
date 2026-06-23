export function getCategoryImagePath(categoryName, version) {
  const base = `/api/assets/categories/${encodeURIComponent(`${categoryName}.png`)}`
  return version ? `${base}?v=${version}` : base
}

export function resolveCategoryImageUrl(category, imageUrl) {
  const explicit = imageUrl ?? (category && typeof category === 'object' ? category.imageUrl : undefined)

  if (explicit) {
    if (explicit.startsWith('http')) {
      return explicit
    }

    return explicit
  }

  const name = typeof category === 'string' ? category : category?.name
  return name ? getCategoryImagePath(name) : ''
}
