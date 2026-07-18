import { useCallback, useEffect, useState } from 'react'
import { deleteSuperadminProduct, getSuperadminProducts } from '../../lib/api'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSuperadminProducts({ page, q: search })
      setProducts(data.products)
      setTotal(data.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  async function handleDelete(product) {
    if (!window.confirm(`Delete product "${product.title}"? This cannot be undone.`)) {
      return
    }

    setBusyId(product.id)
    setError('')
    try {
      await deleteSuperadminProduct(product.id)
      await loadProducts()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div className="sa-page">
      <div className="dash-hero">
        <span className="dash-role-badge">SUPERADMIN</span>
        <h1>Products</h1>
        <p>Browse all listings and remove anything that should not stay on the platform.</p>
      </div>

      <form
        className="sa-toolbar"
        onSubmit={(event) => {
          event.preventDefault()
          setPage(1)
          setSearch(q.trim())
        }}
      >
        <input
          className="auth-input"
          type="search"
          placeholder="Search by title, category, or seller email"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <div className="empty-state">
          <div className="app-spinner" aria-label="Loading" />
        </div>
      ) : (
        <div className="dash-card sa-panel">
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Views</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.title}</td>
                    <td>
                      {product.category}
                      {product.subCategory ? ` / ${product.subCategory}` : ''}
                    </td>
                    <td>{product.seller?.email || '—'}</td>
                    <td>
                      {product.price} {product.priceType}
                    </td>
                    <td>{product.viewCount}</td>
                    <td>{formatDate(product.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline sa-action-btn sa-danger-btn"
                        disabled={busyId === product.id}
                        onClick={() => handleDelete(product)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sa-pagination">
            <button
              type="button"
              className="btn btn-outline"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages} · {total} products
            </span>
            <button
              type="button"
              className="btn btn-outline"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
