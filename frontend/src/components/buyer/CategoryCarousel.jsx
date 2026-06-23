import CategoryIcon from '../CategoryIcon'
import { resolveCategoryIcon } from '../../lib/productFormat'

export default function CategoryCarousel({ categories, activeCategory, onSelectCategory }) {
  return (
    <div className="category-carousel">
      <button
        type="button"
        className={`category-chip${!activeCategory ? ' active' : ''}`}
        onClick={() => onSelectCategory('')}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.name}
          type="button"
          className={`category-chip${activeCategory === category.name ? ' active' : ''}`}
          onClick={() => onSelectCategory(category.name)}
        >
          <CategoryIcon
            name={resolveCategoryIcon(category, category.icon)}
            size={16}
            className="category-chip-icon"
          />
          {category.name}
        </button>
      ))}
    </div>
  )
}
