import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import InquiryModal from '../../components/messages/InquiryModal'
import { useAuth } from '../../context/AuthContext'
import { startInquiry } from '../../lib/conversationsApi'
import {
  formatAttributeKey,
  formatPrice,
  getConditionLabel,
  getPriceTypeLabel,
} from '../../lib/productFormat'
import { getBrowseProduct, getImageUrl } from '../../lib/productsApi'

export default function BuyerProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [inquirySubmitting, setInquirySubmitting] = useState(false)
  const [inquiryError, setInquiryError] = useState('')

  async function handleSendInquiry() {
    setInquirySubmitting(true)
    setInquiryError('')
    try {
      const data = await startInquiry(id, inquiryMessage)
      setInquiryOpen(false)
      setInquiryMessage('')
      navigate(`/buyer/messages/${data.conversationId}`)
    } catch (err) {
      setInquiryError(err.message || 'Failed to send inquiry')
    } finally {
      setInquirySubmitting(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadProduct() {
      setLoading(true)
      setError('')

      try {
        const data = await getBrowseProduct(id)
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
      <AppShell role="buyer" title="Listing details">
        <div className="empty-state">
          <div className="app-spinner" aria-label="Loading" />
        </div>
      </AppShell>
    )
  }

  if (error || !product) {
    return (
      <AppShell role="buyer" title="Listing details">
        <button type="button" className="detail-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <p className="dash-error">{error || 'Product not found'}</p>
      </AppShell>
    )
  }

  const sellerName = product.seller?.name || 'Seller'
  const isOwnListing =
    user?.email && product.seller?.email && user.email === product.seller.email
  const locationPrimary = product.location.address
    ? product.location.address
    : `${product.location.city}, ${product.location.state} — ${product.location.pincode}`
  const locationSecondary = product.location.address
    ? `${product.location.city}, ${product.location.state} — ${product.location.pincode}`
    : null

  return (
    <AppShell role="buyer" title="Listing details">
      <button type="button" className="detail-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="detail-gallery">
        {product.images.length > 0 ? (
          <>
            <img src={getImageUrl(product.images[activeImage])} alt={product.title} />
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', flexWrap: 'wrap' }}>
                {product.images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    style={{
                      border: index === activeImage ? '2px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: 8,
                      padding: 0,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      width: 64,
                      height: 64,
                    }}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="detail-gallery-fallback">No image</div>
        )}
      </div>

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

      <div className="detail-section">
        <h3>Seller</h3>
        <p className="detail-section-sub">Listed by verified seller</p>
        <div className="detail-seller">
          <div className="detail-seller-avatar">{sellerName[0]?.toUpperCase()}</div>
          <div>
            <div className="detail-seller-name">{sellerName}</div>
            {product.seller?.email ? (
              <div className="detail-seller-email">{product.seller.email}</div>
            ) : null}
          </div>
        </div>
        {isOwnListing ? (
          <p className="detail-section-sub inquiry-own-note">This is your own listing.</p>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-block inquiry-cta"
            onClick={() => {
              setInquiryError('')
              setInquiryOpen(true)
            }}
          >
            <span className="inquiry-cta-icon" aria-hidden="true">✉</span>
            Send inquiry to seller
          </button>
        )}
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
          product.attributes.map((attribute, index) => (
            <div key={`${attribute.key}-${index}`} className="detail-attr-row">
              <div className="detail-attr-badge">{index + 1}</div>
              <div>
                <div className="detail-attr-key">{formatAttributeKey(attribute.key)}</div>
                <div className="detail-attr-value">{attribute.value}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="detail-section">
        <h3>Location</h3>
        <p className="detail-section-sub">Pickup availability</p>
        <p className="detail-body">{locationPrimary}</p>
        {locationSecondary ? <p className="detail-section-sub">{locationSecondary}</p> : null}
      </div>

      <Link to="/buyer" className="btn btn-outline">
        Back to browse
      </Link>

      <InquiryModal
        open={inquiryOpen}
        sellerName={sellerName}
        productTitle={product.title}
        message={inquiryMessage}
        submitting={inquirySubmitting}
        error={inquiryError}
        onChangeMessage={setInquiryMessage}
        onClose={() => setInquiryOpen(false)}
        onSubmit={handleSendInquiry}
      />
    </AppShell>
  )
}
