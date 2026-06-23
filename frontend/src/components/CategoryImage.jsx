import { resolveCategoryImageUrl } from '../lib/categoryImages'

export default function CategoryImage({ name, imageUrl, size = 48, className = '' }) {
  const src = resolveCategoryImageUrl(name, imageUrl)

  if (!src) {
    return <span className={`category-image-fallback ${className}`} aria-hidden="true" />
  }

  return (
    <img
      src={src}
      alt=""
      className={`category-image ${className}`}
      width={size}
      height={size}
      loading="lazy"
    />
  )
}
