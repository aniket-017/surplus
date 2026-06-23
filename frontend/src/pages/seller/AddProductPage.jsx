import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProductForm from '../../components/ProductForm'
import { useAuth } from '../../context/AuthContext'
import {
  emptyProductForm,
  isAllowedProductCategory,
  isCompleteLocation,
  profileAddressToLocation,
} from '../../lib/productConstants'
import { analyzeProductImages, createProduct } from '../../lib/productsApi'

const MAX_IMAGES = 5

export default function AddProductPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [form, setForm] = useState(emptyProductForm())
  const [analyzing, setAnalyzing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.address && isCompleteLocation(user.address)) {
      setForm((current) => ({
        ...current,
        location: profileAddressToLocation(user.address),
      }))
    }
  }, [user?.address])

  function handleFileChange(event) {
    const files = Array.from(event.target.files || [])
    setImages((current) => [...current, ...files].slice(0, MAX_IMAGES))
    event.target.value = ''
  }

  function removeImage(index) {
    setImages((current) => current.filter((_, i) => i !== index))
  }

  async function handleAnalyze() {
    if (!images.length) {
      setError('Add at least one product image before analyzing.')
      return
    }

    setAnalyzing(true)
    setError('')

    try {
      const { analysis } = await analyzeProductImages(images)
      setForm((current) => ({
        ...current,
        title: analysis.title,
        category: analysis.category,
        subCategory: analysis.subCategory,
        description: analysis.description,
        quantityUnit: analysis.quantityUnit,
        attributes: analysis.attributes,
      }))
    } catch (err) {
      setError(err.message || 'Failed to analyze images')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!images.length) {
      setError('Add at least one product image.')
      return
    }

    if (!isCompleteLocation(form.location)) {
      setError('City, state, and pincode are required for the pickup location.')
      return
    }

    if (!isAllowedProductCategory(form.category)) {
      setError('Please select a category from the list.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await createProduct(images, form)
      navigate('/seller', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to publish product')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-shell" style={{ gridTemplateColumns: '1fr' }}>
      <div className="app-main">
        <header className="app-topbar">
          <h1 className="app-topbar-title">Add Product</h1>
          <Link to="/seller" className="detail-back" style={{ margin: 0 }}>
            ← Back
          </Link>
        </header>

        <main className="app-content">
          <p style={{ color: 'var(--muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Upload up to 5 images, analyze with AI, review the details, then publish your listing.
          </p>

          <div className="dash-card" style={{ marginBottom: '1rem' }}>
            <h3 className="dash-section-title">Images</h3>
            <div className="image-upload-grid">
              {images.map((file, index) => (
                <div key={`${file.name}-${index}`} className="image-preview-wrap">
                  <img src={URL.createObjectURL(file)} alt="" />
                  <button
                    type="button"
                    className="image-remove-btn"
                    onClick={() => removeImage(index)}
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <label className="image-add-btn">
                  + Add
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={handleAnalyze}
              disabled={analyzing || !images.length}
            >
              {analyzing ? 'Analyzing...' : 'Analyze with AI'}
            </button>
          </div>

          <form className="dash-card" onSubmit={handleSubmit}>
            <ProductForm values={form} onChange={setForm} profileAddress={user?.address} />

            {error ? <p className="dash-error">{error}</p> : null}

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish listing'}
            </button>
          </form>
        </main>
      </div>
    </div>
  )
}
