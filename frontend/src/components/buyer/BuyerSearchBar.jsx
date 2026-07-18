export default function BuyerSearchBar({ value, onChange, onSubmit, onClear }) {
  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      onSubmit?.(value)
    }
  }

  function handleClear() {
    onChange('')
    onClear?.()
  }

  return (
    <div className="buyer-search-wrap">
      <span className="buyer-search-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
      </span>
      <input
        type="search"
        className="buyer-search"
        placeholder="Search surplus materials..."
        aria-label="Search surplus materials"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {value ? (
        <button
          type="button"
          className="buyer-search-clear"
          aria-label="Clear search"
          onClick={handleClear}
        >
          ×
        </button>
      ) : null}
    </div>
  )
}
