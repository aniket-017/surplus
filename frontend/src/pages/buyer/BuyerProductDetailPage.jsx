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
import { getSavedStatus, toggleSavedListing } from '../../lib/savedApi'

export default function BuyerProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
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
        const [data, savedStatus] = await Promise.all([
          getBrowseProduct(id),
          getSavedStatus(id).catch(() => ({ saved: false })),
        ])
        if (!cancelled) {
          setProduct(data.product)
          setSaved(Boolean(savedStatus.saved))
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

  async function handleToggleSave() {
    if (!id || saving) return
    setSaving(true)
    setSaveError('')
    const previous = saved
    setSaved(!previous)
    try {
      const result = await toggleSavedListing(id)
      setSaved(Boolean(result.saved))
    } catch (err) {
      setSaved(previous)
      setSaveError(err.message || 'Failed to update saved listing')
    } finally {
      setSaving(false)
    }
  }

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
        <div className="detail-page">
          <button type="button" className="detail-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <p className="dash-error">{error || 'Product not found'}</p>
        </div>
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
      <div className="detail-page">
        <div className="detail-top-row">
          <button type="button" className="detail-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <button
            type="button"
            className={`detail-save-btn${saved ? ' is-saved' : ''}`}
            onClick={handleToggleSave}
            disabled={saving}
            aria-label={saved ? 'Remove from saved' : 'Save listing'}
            aria-pressed={saved}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              {saved ? (
                <path
                  fill="currentColor"
                  d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5v16.2a.75.75 0 0 1-1.2.6L12 17.25l-4.8 4.05A.75.75 0 0 1 6 20.7V4.5Z"
                />
              ) : (
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                  d="M7.5 4h9A1.5 1.5 0 0 1 18 5.5v14.2a.75.75 0 0 1-1.2.6L12 16.75l-4.8 3.55A.75.75 0 0 1 6 19.7V5.5A1.5 1.5 0 0 1 7.5 4Z"
                />
              )}
            </svg>
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        {saveError ? <p className="dash-error">{saveError}</p> : null}

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

            <div className="detail-seller-block">
              <h3>Seller</h3>
              <p className="detail-section-sub">Listed by verified seller</p>
              <div className="detail-seller">
                <div className="detail-seller-avatar">{sellerName[0]?.toUpperCase()}</div>
                <div>
                  <div className="detail-seller-name">{sellerName}</div>
                  <div className="detail-seller-email">Seller on Surplus</div>
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
                  <span className="inquiry-cta-icon" aria-hidden="true">
                    ✉
                  </span>
                  Send inquiry to seller
                </button>
              )}
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

        <Link to="/buyer" className="btn btn-outline detail-browse-link">
          Back to browse
        </Link>
      </div>

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
