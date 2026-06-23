export function getCategoryImagePath(categoryName) {
  return `/api/assets/categories/${encodeURIComponent(`${categoryName}.png`)}`
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
