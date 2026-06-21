import { useEffect, useState } from 'react'
import {
  CONDITION_OPTIONS,
  isCompleteLocation,
  PRICE_TYPE_OPTIONS,
  profileAddressToLocation,
} from '../lib/productConstants'

export default function ProductForm({ values, onChange, profileAddress }) {
  const hasProfileAddress = Boolean(profileAddress && isCompleteLocation(profileAddress))
  const [useProfileAddress, setUseProfileAddress] = useState(hasProfileAddress)

  useEffect(() => {
    if (hasProfileAddress) {
      setUseProfileAddress(true)
    }
  }, [hasProfileAddress])

  function updateField(key, value) {
    onChange({ ...values, [key]: value })
  }

  function updateLocation(field, value) {
    onChange({
      ...values,
      location: { ...values.location, [field]: value },
    })
  }

  function updateAttribute(index, field, value) {
    const attributes = values.attributes.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    )
    updateField('attributes', attributes)
  }

  function addAttribute() {
    updateField('attributes', [...values.attributes, { key: '', value: '' }])
  }

  function removeAttribute(index) {
    updateField(
      'attributes',
      values.attributes.filter((_, i) => i !== index),
    )
  }

  function handleUseProfileAddressToggle(enabled) {
    setUseProfileAddress(enabled)
    if (enabled && profileAddress && isCompleteLocation(profileAddress)) {
      onChange({
        ...values,
        location: profileAddressToLocation(profileAddress),
      })
    }
  }

  return (
    <div>
      <div className="form-section">
        <h4>Product details</h4>
        <p>Review and edit AI-generated listing information</p>

        <div className="form-field">
          <label className="form-label" htmlFor="title">Title</label>
          <input
            id="title"
            className="form-input"
            value={values.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Product title"
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label" htmlFor="category">Category</label>
            <input
              id="category"
              className="form-input"
              value={values.category}
              onChange={(e) => updateField('category', e.target.value)}
              placeholder="Metals"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="subCategory">Sub-category</label>
            <input
              id="subCategory"
              className="form-input"
              value={values.subCategory}
              onChange={(e) => updateField('subCategory', e.target.value)}
              placeholder="Copper Scrap"
            />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="form-textarea"
            value={values.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe the material or equipment"
          />
        </div>
      </div>

      <div className="form-section">
        <h4>Attributes</h4>
        <p>Material-specific properties detected from your images</p>

        {values.attributes.length === 0 ? (
          <p className="detail-section-sub">
            No attributes yet. Analyze images with AI or add properties manually.
          </p>
        ) : (
          values.attributes.map((attribute, index) => (
            <div key={`attr-${index}`} className="attribute-card">
              <div className="attribute-header">
                <span className="attribute-badge">{index + 1}</span>
                <span style={{ flex: 1, fontWeight: 700 }}>Attribute {index + 1}</span>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                  onClick={() => removeAttribute(index)}
                >
                  Remove
                </button>
              </div>
              <div className="attribute-fields">
                <div className="form-field">
                  <label className="form-label">Property</label>
                  <input
                    className="form-input"
                    value={attribute.key}
                    onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                    placeholder="e.g. purity"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Value</label>
                  <input
                    className="form-input"
                    value={attribute.value}
                    onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                    placeholder="e.g. 99%"
                  />
                </div>
              </div>
            </div>
          ))
        )}

        <button type="button" className="btn btn-outline btn-block" onClick={addAttribute}>
          + Add attribute
        </button>
      </div>

      <div className="form-section">
        <h4>Pricing and stock</h4>
        <p>Set quantity, unit, price, and listing condition</p>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label" htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              className="form-input"
              value={values.quantity}
              onChange={(e) => updateField('quantity', e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="0"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="quantityUnit">Unit</label>
            <input
              id="quantityUnit"
              className="form-input"
              value={values.quantityUnit}
              onChange={(e) => updateField('quantityUnit', e.target.value)}
              placeholder="kg"
            />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="price">Price (₹)</label>
          <input
            id="price"
            className="form-input"
            value={values.price}
            onChange={(e) => updateField('price', e.target.value.replace(/[^\d.]/g, ''))}
            placeholder="Listing price"
          />
        </div>

        <div className="form-field">
          <span className="form-label">Price type</span>
          <div className="form-chips">
            {PRICE_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`form-chip${values.priceType === option.value ? ' active' : ''}`}
                onClick={() => updateField('priceType', option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <span className="form-label">Condition</span>
          <div className="form-chips">
            {CONDITION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`form-chip${values.condition === option.value ? ' active' : ''}`}
                onClick={() => updateField('condition', option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Location</h4>
        <p>Where is this material available for pickup?</p>

        {hasProfileAddress ? (
          <div className="form-toggle-row">
            <div>
              <div style={{ fontWeight: 700 }}>Use my profile address</div>
              <div className="detail-section-sub">Reuse the address saved in your seller profile</div>
            </div>
            <input
              type="checkbox"
              checked={useProfileAddress}
              onChange={(e) => handleUseProfileAddressToggle(e.target.checked)}
            />
          </div>
        ) : (
          <p className="detail-section-sub">
            Add an address in your profile to reuse it here, or enter a pickup location below.
          </p>
        )}

        {useProfileAddress && hasProfileAddress && profileAddress ? (
          <div className="dash-card">
            {profileAddress.address?.trim() ? <p>{profileAddress.address.trim()}</p> : null}
            <p>
              {[profileAddress.city, profileAddress.state].filter(Boolean).join(', ')}
              {profileAddress.pincode ? ` - ${profileAddress.pincode}` : ''}
            </p>
          </div>
        ) : (
          <>
            <div className="form-field">
              <label className="form-label" htmlFor="address">Address</label>
              <input
                id="address"
                className="form-input"
                value={values.location.address || ''}
                onChange={(e) => updateLocation('address', e.target.value)}
                placeholder="Street address (optional)"
              />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label" htmlFor="city">City</label>
                <input
                  id="city"
                  className="form-input"
                  value={values.location.city}
                  onChange={(e) => updateLocation('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="state">State</label>
                <input
                  id="state"
                  className="form-input"
                  value={values.location.state}
                  onChange={(e) => updateLocation('state', e.target.value)}
                  placeholder="State"
                />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="pincode">Pincode</label>
              <input
                id="pincode"
                className="form-input"
                style={{ maxWidth: 180 }}
                value={values.location.pincode}
                onChange={(e) =>
                  updateLocation('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="6-digit pincode"
                maxLength={6}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
