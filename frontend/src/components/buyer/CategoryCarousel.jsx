import CategoryImage from '../CategoryImage'

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
          className={`category-chip category-chip-image${activeCategory === category.name ? ' active' : ''}`}
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
      ))}
    </div>
  )
}
