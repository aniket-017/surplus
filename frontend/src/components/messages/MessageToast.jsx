export default function MessageToast({ toast, onClose, onOpen }) {
  if (!toast) return null

  return (
    <div className="msg-toast" role="status" aria-live="polite">
      <button type="button" className="msg-toast-body" onClick={() => onOpen?.(toast)}>
        <span className="msg-toast-eyebrow">New message</span>
        <span className="msg-toast-title">{toast.title}</span>
        <span className="msg-toast-preview">{toast.body}</span>
      </button>
      <button type="button" className="msg-toast-close" onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
