import { useEffect, useRef } from 'react'

export default function InquiryModal({
  open,
  sellerName,
  productTitle,
  message,
  submitting,
  error,
  onChangeMessage,
  onClose,
  onSubmit,
}) {
  const textareaRef = useRef(null)

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 60)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="inquiry-overlay" role="dialog" aria-modal="true" aria-label="Send inquiry">
      <button type="button" className="inquiry-backdrop" aria-label="Close" onClick={onClose} />
      <div className="inquiry-sheet">
        <div className="inquiry-sheet-head">
          <div>
            <h3 className="inquiry-title">Send inquiry</h3>
            <p className="inquiry-subtitle">
              Message {sellerName || 'the seller'} about{' '}
              <strong>{productTitle || 'this listing'}</strong>. You can continue the chat in Messages.
            </p>
          </div>
          <button type="button" className="inquiry-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="form-textarea inquiry-textarea"
          value={message}
          onChange={(event) => onChangeMessage(event.target.value)}
          placeholder="Hi, I'm interested in this listing. Is it still available?"
          rows={4}
        />

        {error ? <p className="dash-error">{error}</p> : null}

        <div className="inquiry-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Sending…' : 'Send inquiry'}
          </button>
        </div>
      </div>
    </div>
  )
}
