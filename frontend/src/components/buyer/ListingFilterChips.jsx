const FILTERS = [
  { id: 'all', label: 'All', sort: 'recent' },
  { id: 'near', label: 'Near Me', disabled: true },
  { id: 'price', label: 'Best Price', sort: 'price_asc' },
  { id: 'recent', label: 'Recently Added', sort: 'recent' },
]

export default function ListingFilterChips({ activeFilter, onChangeFilter }) {
  return (
    <div className="filter-section">
      <div className="filter-header">
        <h3>Popular Listings</h3>
        <span>Sort</span>
      </div>
      <div className="filter-chips">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={`filter-chip${activeFilter === filter.id ? ' active' : ''}`}
            disabled={filter.disabled}
            onClick={() => onChangeFilter(filter.id, filter.sort || 'recent')}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  )
}
