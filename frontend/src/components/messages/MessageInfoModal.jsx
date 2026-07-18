import MessageReceipt from './MessageReceipt'
import { formatMessageInfoTime } from '../../lib/messageFormat'

export default function MessageInfoModal({ message, onClose }) {
  if (!message) return null

  const preview =
    message.body?.trim() ||
    (message.imageUrl ? 'Photo' : null) ||
    (message.fileName ? message.fileName : null) ||
    'Message'

  return (
    <div className="chat-info-backdrop" role="presentation" onClick={onClose}>
      <div
        className="chat-info-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-info-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="chat-info-handle" />
        <h2 id="chat-info-title" className="chat-info-title">
          Message info
        </h2>

        <div className="chat-info-preview">
          <p className="chat-info-preview-text">{preview}</p>
          <div className="chat-info-preview-meta">
            <span>{formatMessageInfoTime(message.createdAt)}</span>
            <MessageReceipt status={message.status} tone="onAccent" />
          </div>
        </div>

        <div className="chat-info-receipts">
          <div className="chat-info-row">
            <span className="chat-info-row-label">
              <MessageReceipt status="delivered" tone="onLight" />
              Delivered
            </span>
            <span className={message.deliveredAt ? '' : 'chat-info-waiting'}>
              {message.deliveredAt ? formatMessageInfoTime(message.deliveredAt) : 'Waiting'}
            </span>
          </div>
          <div className="chat-info-row">
            <span className="chat-info-row-label">
              <MessageReceipt status={message.readAt ? 'read' : 'delivered'} tone="onLight" />
              Read
            </span>
            <span className={message.readAt ? '' : 'chat-info-waiting'}>
              {message.readAt ? formatMessageInfoTime(message.readAt) : 'Waiting'}
            </span>
          </div>
        </div>

        <button type="button" className="chat-info-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
