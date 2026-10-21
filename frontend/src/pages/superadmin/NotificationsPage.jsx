import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getSuperadminNotifications,
  getSuperadminProducts,
  getSuperadminUsers,
  sendSuperadminNotification,
  uploadSuperadminNotificationImage,
} from '../../lib/api'
import { getCategories } from '../../lib/productsApi'

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'All users' },
  { value: 'BUYERS', label: 'Buyers only' },
  { value: 'SELLERS', label: 'Sellers only' },
  { value: 'SPECIFIC', label: 'Specific users' },
]

const AUDIENCE_LABELS = {
  ALL: 'All users',
  BUYERS: 'Buyers',
  SELLERS: 'Sellers',
  SPECIFIC: 'Specific users',
}

const KIND_OPTIONS = [
  { value: 'GENERAL', label: 'General' },
  { value: 'PROMOTION', label: 'Promotion' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'ALERT', label: 'Alert' },
]

const KIND_LABELS = Object.fromEntries(KIND_OPTIONS.map((option) => [option.value, option.label]))

const ACTION_OPTIONS = [
  { value: 'NONE', label: 'Open notifications inbox' },
  { value: 'PRODUCT', label: 'Open a product' },
  { value: 'CATEGORY', label: 'Open a category' },
  { value: 'EXPLORE', label: 'Open Explore' },
  { value: 'SCREEN', label: 'Open an app screen' },
  { value: 'URL', label: 'Open a web link' },
]

const ACTION_LABELS = {
  NONE: 'Inbox',
  PRODUCT: 'Product',
  CATEGORY: 'Category',
  EXPLORE: 'Explore',
  SCREEN: 'Screen',
  URL: 'Web link',
}

const SCREEN_OPTIONS = [
  { value: 'ADD_PRODUCT', label: 'Add product photos (Sell)', hint: 'Buyers are switched to seller mode first.' },
  { value: 'MY_LISTINGS', label: 'My listings', hint: 'Buyers are switched to seller mode first.' },
  { value: 'SAVED', label: 'Saved listings', hint: 'Sellers are switched to buyer mode first.' },
  { value: 'HOME', label: 'Home' },
  { value: 'MESSAGES', label: 'Messages' },
  { value: 'PROFILE', label: 'Profile' },
]

const SCREEN_LABELS = Object.fromEntries(SCREEN_OPTIONS.map((option) => [option.value, option.label]))

const CTA_MAX = 24

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export default function NotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [kind, setKind] = useState('GENERAL')
  const [audience, setAudience] = useState('ALL')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [userQuery, setUserQuery] = useState('')
  const [userResults, setUserResults] = useState([])
  const [searchingUsers, setSearchingUsers] = useState(false)

  const [image, setImage] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState('')

  const [actionType, setActionType] = useState('NONE')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productQuery, setProductQuery] = useState('')
  const [productResults, setProductResults] = useState([])
  const [searchingProducts, setSearchingProducts] = useState(false)
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState('')
  const [screen, setScreen] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')

  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')

  const [notifications, setNotifications] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')

  const selectedIds = useMemo(
    () => new Set(selectedUsers.map((user) => user.id)),
    [selectedUsers],
  )

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setListError('')
    try {
      const data = await getSuperadminNotifications({ page })
      setNotifications(data.notifications)
      setTotal(data.total)
    } catch (err) {
      setListError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (actionType !== 'CATEGORY' || categories.length > 0) return
    getCategories()
      .then((data) => setCategories((data.categories || []).map((item) => item.name)))
      .catch(() => setCategories([]))
  }, [actionType, categories.length])

  useEffect(() => {
    if (audience !== 'SPECIFIC') return undefined

    const q = userQuery.trim()
    if (q.length < 2) {
      setUserResults([])
      return undefined
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      setSearchingUsers(true)
      try {
        const data = await getSuperadminUsers({ page: 1, limit: 10, q })
        if (!cancelled) {
          setUserResults(data.users.filter((user) => !user.isBanned && user.role))
        }
      } catch {
        if (!cancelled) setUserResults([])
      } finally {
        if (!cancelled) setSearchingUsers(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [audience, userQuery])

  useEffect(() => {
    if (actionType !== 'PRODUCT') return undefined

    const q = productQuery.trim()
    if (q.length < 2) {
      setProductResults([])
      return undefined
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      setSearchingProducts(true)
      try {
        const data = await getSuperadminProducts({ page: 1, limit: 10, q })
        if (!cancelled) {
          setProductResults(
            data.products.filter((product) => (product.listingStatus || 'ACTIVE') === 'ACTIVE'),
          )
        }
      } catch {
        if (!cancelled) setProductResults([])
      } finally {
        if (!cancelled) setSearchingProducts(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [actionType, productQuery])

  function toggleUser(user) {
    setSelectedUsers((current) => {
      if (current.some((item) => item.id === user.id)) {
        return current.filter((item) => item.id !== user.id)
      }
      return [...current, user]
    })
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setImageError('')
    setUploadingImage(true)
    try {
      const data = await uploadSuperadminNotificationImage(file)
      setImage({ imageUrl: data.imageUrl, previewUrl: data.previewUrl || data.imageUrl })
    } catch (err) {
      setImageError(err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  function handleActionChange(value) {
    setActionType(value)
    if (value === 'NONE') setCtaLabel('')
  }

  function getActionValue() {
    if (actionType === 'PRODUCT') return selectedProduct?.id || ''
    if (actionType === 'CATEGORY') return category
    if (actionType === 'SCREEN') return screen
    if (actionType === 'URL') return linkUrl.trim()
    return ''
  }

  function resetForm() {
    setTitle('')
    setBody('')
    setKind('GENERAL')
    setAudience('ALL')
    setSelectedUsers([])
    setUserQuery('')
    setUserResults([])
    setImage(null)
    setImageError('')
    setActionType('NONE')
    setSelectedProduct(null)
    setProductQuery('')
    setProductResults([])
    setCategory('')
    setScreen('')
    setLinkUrl('')
    setCtaLabel('')
  }

  async function handleSend(event) {
    event.preventDefault()
    setSendError('')
    setSendSuccess('')

    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    const actionValue = getActionValue()

    if (!trimmedTitle || !trimmedBody) {
      setSendError('Title and body are required')
      return
    }
    if (audience === 'SPECIFIC' && selectedUsers.length === 0) {
      setSendError('Select at least one user')
      return
    }
    if (actionType === 'PRODUCT' && !actionValue) {
      setSendError('Select a product for the tap action')
      return
    }
    if (actionType === 'CATEGORY' && !actionValue) {
      setSendError('Select a category for the tap action')
      return
    }
    if (actionType === 'SCREEN' && !actionValue) {
      setSendError('Select an app screen for the tap action')
      return
    }
    if (actionType === 'URL' && !isHttpsUrl(actionValue)) {
      setSendError('Web link must start with https://')
      return
    }
    if (uploadingImage) {
      setSendError('Wait for the image to finish uploading')
      return
    }

    const audienceLabel = AUDIENCE_LABELS[audience] || audience
    const confirmMessage =
      audience === 'SPECIFIC'
        ? `Send this notification to ${selectedUsers.length} selected user(s)?`
        : `Send this notification to ${audienceLabel.toLowerCase()}?`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setSending(true)
    try {
      const data = await sendSuperadminNotification({
        title: trimmedTitle,
        body: trimmedBody,
        audience,
        targetUserIds: audience === 'SPECIFIC' ? selectedUsers.map((user) => user.id) : [],
        kind,
        imageUrl: image?.imageUrl || null,
        actionType,
        actionValue: actionValue || null,
        ctaLabel: actionType !== 'NONE' ? ctaLabel.trim() || null : null,
      })
      resetForm()
      setSendSuccess(
        `Sent to ${data.notification.recipientCount} recipient${
          data.notification.recipientCount === 1 ? '' : 's'
        }.`,
      )
      setPage(1)
      await loadNotifications()
    } catch (err) {
      setSendError(err.message)
    } finally {
      setSending(false)
    }
  }

  function describeAction(item) {
    const label = ACTION_LABELS[item.actionType] || ACTION_LABELS.NONE
    if (!item.actionValue) return label
    if (item.actionType === 'SCREEN') return `${label}: ${SCREEN_LABELS[item.actionValue] || item.actionValue}`
    return `${label}: ${item.actionValue}`
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))
  const screenHint = SCREEN_OPTIONS.find((option) => option.value === screen)?.hint
  const previewTitle = title.trim() || 'Notification title'
  const previewBody = body.trim() || 'Notification message'

  return (
    <div className="sa-page">
      <div className="dash-hero">
        <span className="dash-role-badge">SUPERADMIN</span>
        <h1>Notifications</h1>
        <p>Compose announcements and send them to buyers, sellers, or specific users.</p>
      </div>

      <div className="dash-card sa-panel">
        <div className="sa-panel-header">
          <h2>Compose</h2>
        </div>

        <div className="sa-compose-layout">
          <form className="sa-compose-form" onSubmit={handleSend}>
            <fieldset className="sa-field">
              <legend>Type</legend>
              <div className="sa-audience-options">
                {KIND_OPTIONS.map((option) => (
                  <label key={option.value} className="sa-radio-label">
                    <input
                      type="radio"
                      name="kind"
                      value={option.value}
                      checked={kind === option.value}
                      onChange={() => setKind(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="sa-field">
              <span>Title</span>
              <input
                className="auth-input"
                type="text"
                maxLength={80}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Short headline"
                required
              />
            </label>

            <label className="sa-field">
              <span>Body</span>
              <textarea
                className="auth-input sa-textarea"
                maxLength={500}
                rows={4}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Notification message"
                required
              />
            </label>

            <div className="sa-field">
              <span>Image (optional)</span>
              <div className="image-upload-grid">
                {image ? (
                  <div className="image-preview-wrap sa-notif-image-wrap">
                    <img src={image.previewUrl} alt="Notification" />
                    <button
                      type="button"
                      className="image-remove-btn"
                      onClick={() => setImage(null)}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="image-add-btn sa-notif-image-wrap">
                    {uploadingImage ? 'Uploading…' : '+ Add image'}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={uploadingImage}
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              <p className="sa-muted-text">Shown in the banner and the in-app inbox. Wide images (2:1) look best.</p>
              {imageError ? <p className="auth-error">{imageError}</p> : null}
            </div>

            <label className="sa-field">
              <span>When tapped</span>
              <select
                className="auth-input"
                value={actionType}
                onChange={(event) => handleActionChange(event.target.value)}
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {actionType === 'PRODUCT' ? (
              <div className="sa-field">
                <span>Product</span>
                {selectedProduct ? (
                  <div className="sa-selected-users">
                    <button
                      type="button"
                      className="sa-chip"
                      onClick={() => setSelectedProduct(null)}
                    >
                      {selectedProduct.title} · {selectedProduct.category} ×
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      className="auth-input"
                      type="search"
                      placeholder="Search active listings by title or category"
                      value={productQuery}
                      onChange={(event) => setProductQuery(event.target.value)}
                    />
                    {searchingProducts ? <p className="sa-muted-text">Searching…</p> : null}
                    {productResults.length > 0 ? (
                      <ul className="sa-user-picker">
                        {productResults.map((product) => (
                          <li key={product.id}>
                            <button
                              type="button"
                              className="sa-picker-option"
                              onClick={() => {
                                setSelectedProduct(product)
                                setProductQuery('')
                                setProductResults([])
                              }}
                            >
                              {product.title}
                              <span className="sa-muted-text">
                                {' '}
                                · {product.category} · {product.seller?.name || product.seller?.email || 'Seller'}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}

            {actionType === 'CATEGORY' ? (
              <label className="sa-field">
                <span>Category</span>
                <select
                  className="auth-input"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="">Select a category</option>
                  {categories.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {actionType === 'SCREEN' ? (
              <label className="sa-field">
                <span>App screen</span>
                <select
                  className="auth-input"
                  value={screen}
                  onChange={(event) => setScreen(event.target.value)}
                >
                  <option value="">Select a screen</option>
                  {SCREEN_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {screenHint ? <span className="sa-muted-text">{screenHint}</span> : null}
              </label>
            ) : null}

            {actionType === 'URL' ? (
              <label className="sa-field">
                <span>Web link</span>
                <input
                  className="auth-input"
                  type="url"
                  placeholder="https://surplustovalue.com/offer"
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                />
              </label>
            ) : null}

            {actionType !== 'NONE' ? (
              <label className="sa-field">
                <span>Button label (optional)</span>
                <input
                  className="auth-input"
                  type="text"
                  maxLength={CTA_MAX}
                  placeholder="e.g. View offer"
                  value={ctaLabel}
                  onChange={(event) => setCtaLabel(event.target.value)}
                />
              </label>
            ) : null}

            <fieldset className="sa-field">
              <legend>Audience</legend>
              <div className="sa-audience-options">
                {AUDIENCE_OPTIONS.map((option) => (
                  <label key={option.value} className="sa-radio-label">
                    <input
                      type="radio"
                      name="audience"
                      value={option.value}
                      checked={audience === option.value}
                      onChange={() => setAudience(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {audience === 'SPECIFIC' ? (
              <div className="sa-field">
                <span>Select users</span>
                <input
                  className="auth-input"
                  type="search"
                  placeholder="Search by name, email, or number"
                  value={userQuery}
                  onChange={(event) => setUserQuery(event.target.value)}
                />
                {searchingUsers ? <p className="sa-muted-text">Searching…</p> : null}
                {userResults.length > 0 ? (
                  <ul className="sa-user-picker">
                    {userResults.map((user) => (
                      <li key={user.id}>
                        <label className="sa-radio-label">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(user.id)}
                            onChange={() => toggleUser(user)}
                          />
                          <span>
                            {user.name || 'Unnamed'}
                            <span className="sa-muted-text">
                              {' '}
                              · {user.email || user.phone || 'No contact'} · {user.role || '—'}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {selectedUsers.length > 0 ? (
                  <div className="sa-selected-users">
                    {selectedUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="sa-chip"
                        onClick={() => toggleUser(user)}
                      >
                        {user.name || user.email || user.phone || user.id} ×
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {sendError ? <p className="auth-error">{sendError}</p> : null}
            {sendSuccess ? <p className="sa-success-text">{sendSuccess}</p> : null}

            <button type="submit" className="btn btn-primary" disabled={sending || uploadingImage}>
              {sending ? 'Sending…' : 'Send notification'}
            </button>
          </form>

          <aside className="sa-notif-preview" aria-label="Preview">
            <span className="sa-notif-preview-label">Preview</span>
            <div className="sa-notif-card">
              <span className={`sa-kind-tag sa-kind-${kind.toLowerCase()}`}>{KIND_LABELS[kind]}</span>
              <strong className="sa-notif-card-title">{previewTitle}</strong>
              <p className="sa-notif-card-body">{previewBody}</p>
              {image ? <img className="sa-notif-card-image" src={image.previewUrl} alt="" /> : null}
              {actionType !== 'NONE' && ctaLabel.trim() ? (
                <span className="sa-notif-card-cta">{ctaLabel.trim()}</span>
              ) : null}
            </div>
          </aside>
        </div>
      </div>

      <div className="dash-card sa-panel">
        <div className="sa-panel-header">
          <h2>Sent history</h2>
        </div>

        {listError ? <p className="auth-error">{listError}</p> : null}

        {loading ? (
          <div className="empty-state">
            <div className="app-spinner" aria-label="Loading" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <p>No notifications sent yet.</p>
          </div>
        ) : (
          <>
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Tap action</th>
                    <th>Audience</th>
                    <th>Recipients</th>
                    <th>Sent by</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.createdAt)}</td>
                      <td>
                        <span className={`sa-kind-tag sa-kind-${(item.kind || 'GENERAL').toLowerCase()}`}>
                          {KIND_LABELS[item.kind] || KIND_LABELS.GENERAL}
                        </span>
                      </td>
                      <td>
                        <div className="sa-notif-history-title">
                          {item.imageUrl ? (
                            <img className="sa-notif-history-thumb" src={item.imageUrl} alt="" />
                          ) : null}
                          <div>
                            <div>{item.title}</div>
                            <div className="sa-muted-text">{item.body}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="sa-notif-history-action">{describeAction(item)}</div>
                        {item.ctaLabel ? (
                          <div className="sa-muted-text">Button: {item.ctaLabel}</div>
                        ) : null}
                      </td>
                      <td>{AUDIENCE_LABELS[item.audience] || item.audience}</td>
                      <td>{item.recipientCount}</td>
                      <td>
                        {item.createdBy?.name || '—'}
                        <div className="sa-muted-text">{item.createdBy?.email || ''}</div>
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
                Page {page} of {totalPages} · {total} notifications
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
          </>
        )}
      </div>
    </div>
  )
}
