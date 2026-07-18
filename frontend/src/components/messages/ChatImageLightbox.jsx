import { useEffect } from 'react'

export default function ChatImageLightbox({ images, index, onClose, onChangeIndex }) {
  const total = images.length
  const current = images[index]
  const hasMultiple = total > 1

  useEffect(() => {
    if (!current) return undefined

    function onKey(event) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (!hasMultiple) return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onChangeIndex((index - 1 + total) % total)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        onChangeIndex((index + 1) % total)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [current, hasMultiple, index, onChangeIndex, onClose, total])

  if (!current) return null

  return (
    <div className="chat-lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
      <button type="button" className="chat-lightbox-backdrop" aria-label="Close" onClick={onClose} />

      <div className="chat-lightbox-content">
        <button type="button" className="chat-lightbox-close" aria-label="Close" onClick={onClose}>
          ×
        </button>

        {hasMultiple ? (
          <button
            type="button"
            className="chat-lightbox-nav chat-lightbox-prev"
            aria-label="Previous image"
            onClick={() => onChangeIndex((index - 1 + total) % total)}
          >
            ‹
          </button>
        ) : null}

        <img src={current} alt={`Attachment ${index + 1} of ${total}`} className="chat-lightbox-image" />

        {hasMultiple ? (
          <button
            type="button"
            className="chat-lightbox-nav chat-lightbox-next"
            aria-label="Next image"
            onClick={() => onChangeIndex((index + 1) % total)}
          >
            ›
          </button>
        ) : null}

        {hasMultiple ? (
          <div className="chat-lightbox-counter" aria-live="polite">
            {index + 1} / {total}
          </div>
        ) : null}
      </div>
    </div>
  )
}
