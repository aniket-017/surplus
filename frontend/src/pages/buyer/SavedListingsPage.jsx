import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import ProductListingCard from '../../components/buyer/ProductListingCard'
import { getSavedListings, toggleSavedListing } from '../../lib/savedApi'

export default function SavedListingsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [togglingId, setTogglingId] = useState(null)

  const loadSaved = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSavedListings()
      setProducts(data.products || [])
    } catch (err) {
      setError(err.message || 'Failed to load saved listings')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSaved()
  }, [loadSaved])

  async function handleToggleSave(productId) {
    if (togglingId) return
    setTogglingId(productId)
    try {
      const result = await toggleSavedListing(productId)
      if (!result.saved) {
        setProducts((current) => current.filter((item) => item.id !== productId))
      }
    } catch (err) {
      setError(err.message || 'Failed to update saved listing')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <AppShell role="buyer" title="Saved">
      <div className="buyer-home-header">
        <div className="buyer-home-header-text">
          <h2>Saved listings</h2>
          <p>Products you bookmarked for later</p>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={loadSaved}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error ? <p className="dash-error">{error}</p> : null}

      {loading ? (
        <div className="empty-state">
          <div className="app-spinner" aria-label="Loading" />
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h3>No saved listings yet</h3>
          <p>Tap the bookmark on any product to save it here for later.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/buyer')}>
            Browse listings
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductListingCard
              key={product.id}
              product={product}
              saved
              onToggleSave={() => handleToggleSave(product.id)}
              onClick={() => navigate(`/buyer/products/${product.id}`)}
            />
          ))}
        </div>
      )}
    </AppShell>
  )
}
