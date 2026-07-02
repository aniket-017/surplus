import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import CategoryImage from '../../components/CategoryImage'
import { getCategories } from '../../lib/productsApi'
import { getCategoryTheme } from '../../lib/categoryTheme'

function formatCount(count) {
  if (count == null) return 'Browse listings'
  if (count === 0) return 'No listings yet'
  return `${count} ${count === 1 ? 'listing' : 'listings'}`
}

export default function CategoriesPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getCategories()
      setCategories(data.categories)
    } catch (err) {
      setError(err.message || 'Failed to load categories')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  return (
    <AppShell role="buyer" title="Categories">
      <div className="buyer-home-header">
        <h2>Categories</h2>
        <p>Browse surplus materials by category</p>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="app-spinner" aria-label="Loading" />
        </div>
      ) : error ? (
        <div className="empty-state">
          <p className="dash-error">{error}</p>
          <button type="button" className="btn btn-primary" onClick={loadCategories}>
            Try again
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <p>No categories yet. Check back when listings are available.</p>
        </div>
      ) : (
        <div className="categories-list">
          {categories.map((category) => {
            const theme = getCategoryTheme(category.name)
            return (
              <button
                key={category.name}
                type="button"
                className="category-list-card"
                style={{ '--cat-color': theme.iconColor, '--cat-bg': theme.iconBg }}
                onClick={() => navigate(`/buyer?category=${encodeURIComponent(category.name)}`)}
              >
                <div className="category-list-card-icon">
                  <CategoryImage
                    name={category.name}
                    imageUrl={category.imageUrl}
                    size={72}
                    className="category-list-card-image"
                  />
                </div>
                <div className="category-list-card-body">
                  <span className="category-list-card-name">{category.name}</span>
                  <span className="category-list-card-count">{formatCount(category.count)}</span>
                </div>
                <span className="category-list-card-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
