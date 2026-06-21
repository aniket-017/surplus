import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import { getCategoryEmoji } from '../../lib/productFormat'
import { getCategories } from '../../lib/productsApi'

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
        <div className="categories-grid">
          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              className="category-tile"
              onClick={() => navigate(`/buyer?category=${encodeURIComponent(category.name)}`)}
            >
              <div className="category-tile-icon">{getCategoryEmoji(category.name)}</div>
              <div className="category-tile-name">{category.name}</div>
              <div className="category-tile-count">{category.count} listings</div>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  )
}
