import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import { formatPrice } from '../../lib/productFormat'
import { getImageUrl, getMyProducts } from '../../lib/productsApi'

function formatCondition(condition) {
  return condition.charAt(0).toUpperCase() + condition.slice(1)
}

export default function SellerDashboardPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState({ activeListings: 0, totalViews: 0, totalInquiries: 0 })
  const [loading, setLoading] = useState(true)

  const loadProducts = useCallback(async () => {
    try {
      const data = await getMyProducts()
      setProducts(data.products)
      setStats(data.stats ?? { activeListings: data.products.length, totalViews: 0, totalInquiries: 0 })
    } catch {
      setProducts([])
      setStats({ activeListings: 0, totalViews: 0, totalInquiries: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return (
    <AppShell role="seller" title="Seller Dashboard">
      <div className="dash-hero">
        <span className="dash-role-badge">SELLER</span>
        <h1>Seller Dashboard</h1>
        <p>Manage your surplus listings and track listing performance.</p>
      </div>

      <div className="dash-stats">
        <div className="dash-stat">
          <div className="dash-stat-value">{stats.activeListings}</div>
          <div className="dash-stat-label">Active Listings</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{stats.totalViews}</div>
          <div className="dash-stat-label">Views</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-value">{stats.totalInquiries}</div>
          <div className="dash-stat-label">Inquiries</div>
        </div>
      </div>

      <Link to="/seller/add-product" className="btn btn-primary btn-block" style={{ marginBottom: '1rem' }}>
        Add Product
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 className="dash-section-title" style={{ margin: 0 }}>My listings</h2>
        <span style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>
          {products.length} total
        </span>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="app-spinner" aria-label="Loading" />
        </div>
      ) : products.length === 0 ? (
        <div className="dash-card empty-state">
          <h3>No listings yet</h3>
          <p>Add your first surplus item to start reaching buyers on Surplus.</p>
        </div>
      ) : (
        products.map((product) => (
          <button
            key={product.id}
            type="button"
            className="listing-row"
            onClick={() => navigate(`/seller/products/${product.id}`)}
          >
            {product.images[0] ? (
              <img
                src={getImageUrl(product.images[0])}
                alt=""
                className="listing-row-image"
              />
            ) : (
              <div className="listing-row-image" />
            )}
            <div className="listing-row-info">
              <div className="listing-row-top">
                <div className="listing-row-title">{product.title}</div>
                <span className="listing-condition">{formatCondition(product.condition)}</span>
              </div>
              <div className="listing-row-meta">
                {product.category} / {product.subCategory}
              </div>
              <div className="listing-row-price">
                {formatPrice(product.price)} · {product.quantity} {product.quantityUnit}
              </div>
            </div>
          </button>
        ))
      )}
    </AppShell>
  )
}
