import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import {
  formatAttributeKey,
  formatPrice,
  getConditionLabel,
  getPriceTypeLabel,
} from '../../lib/productFormat'
import { getImageUrl, getSellerProduct } from '../../lib/productsApi'

export default function SellerProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadProduct() {
      setLoading(true)
      setError('')

      try {
        const data = await getSellerProduct(id)
        if (!cancelled) {
          setProduct(data.product)
          setActiveImage(0)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load product')
          setProduct(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProduct()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <AppShell role="seller" title="Listing details">
        <div className="empty-state">
          <div className="app-spinner" aria-label="Loading" />
        </div>
      </AppShell>
    )
  }

  if (error || !product) {
    return (
      <AppShell role="seller" title="Listing details">
        <div className="detail-page">
          <button type="button" className="detail-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <p className="dash-error">{error || 'Product not found'}</p>
        </div>
      </AppShell>
    )
  }

  const locationPrimary = product.location.address
    ? product.location.address
    : `${product.location.city}, ${product.location.state} — ${product.location.pincode}`
  const locationSecondary = product.location.address
    ? `${product.location.city}, ${product.location.state} — ${product.location.pincode}`
    : null

  return (
    <AppShell role="seller" title="Listing details">
      <div className="detail-page">
        <div className="detail-top-row">
          <button type="button" className="detail-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        <div className="detail-hero">
          <div className="detail-gallery">
            {product.images.length > 0 ? (
              <>
                <img src={getImageUrl(product.images[activeImage])} alt={product.title} />
                {product.images.length > 1 ? (
                  <div className="detail-thumbs">
                    {product.images.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        className={`detail-thumb${index === activeImage ? ' is-active' : ''}`}
                        onClick={() => setActiveImage(index)}
                        aria-label={`View photo ${index + 1}`}
                      >
                        <img src={getImageUrl(image)} alt="" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="detail-gallery-fallback">No image</div>
            )}
          </div>

          <div className="detail-hero-side">
            <div className="detail-summary">
              <div className="detail-chips">
                <span className="detail-chip">{product.category}</span>
                <span className="detail-chip muted">{product.subCategory}</span>
              </div>
              <h2 className="detail-title">{product.title}</h2>
              <div className="detail-price-row">
                <span className="detail-price">{formatPrice(product.price)}</span>
                <span className="detail-price-type">{getPriceTypeLabel(product.priceType)}</span>
              </div>
              <div className="detail-stats">
                <div>
                  <div className="detail-stat-label">Condition</div>
                  <div className="detail-stat-value">{getConditionLabel(product.condition)}</div>
                </div>
                <div>
                  <div className="detail-stat-label">Available</div>
                  <div className="detail-stat-value">
                    {product.quantity} {product.quantityUnit}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Description</h3>
          <p className="detail-section-sub">Product overview</p>
          <p className="detail-body">{product.description}</p>
        </div>

        <div className="detail-section">
          <h3>Specifications</h3>
          <p className="detail-section-sub">
            {product.attributes.length
              ? `${product.attributes.length} material-specific properties`
              : 'No specifications listed'}
          </p>
          {product.attributes.length === 0 ? (
            <p className="detail-section-sub">No attributes were added for this listing.</p>
          ) : (
            <div className="detail-attrs">
              {product.attributes.map((attribute, index) => (
                <div key={`${attribute.key}-${index}`} className="detail-attr-row">
                  <div className="detail-attr-key">{formatAttributeKey(attribute.key)}</div>
                  <div className="detail-attr-value">{attribute.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-section">
          <h3>Location</h3>
          <p className="detail-section-sub">Pickup availability</p>
          <p className="detail-body">{locationPrimary}</p>
          {locationSecondary ? <p className="detail-section-sub">{locationSecondary}</p> : null}
        </div>
      </div>
    </AppShell>
  )
}
