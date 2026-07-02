import CategoryImage from '../CategoryImage'
import { getCategoryTheme } from '../../lib/categoryTheme'

export default function CategoryCarousel({ categories, activeCategory, onSelectCategory }) {
  return (
    <div className="category-carousel" role="tablist" aria-label="Filter by category">
      <button
        type="button"
        role="tab"
        aria-selected={!activeCategory}
        className={`category-chip category-chip-all${!activeCategory ? ' active' : ''}`}
        onClick={() => onSelectCategory('')}
      >
        All
      </button>
      {categories.map((category) => {
        const theme = getCategoryTheme(category.name)
        const isActive = activeCategory === category.name
        return (
          <button
            key={category.name}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`category-chip category-chip-cat${isActive ? ' active' : ''}`}
            style={{ '--cat-color': theme.iconColor, '--cat-bg': theme.iconBg }}
            onClick={() => onSelectCategory(category.name)}
          >
            <span className="category-chip-thumb">
              <CategoryImage
                name={category.name}
                imageUrl={category.imageUrl}
                size={28}
                className="category-chip-image"
              />
            </span>
            {category.name}
          </button>
        )
      })}
    </div>
  )
}
