import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import {
  getConversationMessages,
  sendMessage,
  sendMessageWithAttachment,
} from '../lib/conversationsApi'
import { buildMessageListItems, formatMessageTime } from '../lib/messageFormat'
import { getImageUrl } from '../lib/productsApi'

export default function ChatThreadPage({ role }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [messages, setMessages] = useState([])
  const [product, setProduct] = useState(null)
  const [otherParty, setOtherParty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const listRef = useRef(null)
  const fileInputRef = useRef(null)

  const listItems = useMemo(() => buildMessageListItems(messages, user?.id), [messages, user?.id])

  const loadMessages = useCallback(async () => {
    try {
      const data = await getConversationMessages(id)
      setMessages(data.messages)
      setProduct(data.conversation.product)
      setOtherParty(data.conversation.otherParty)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    setLoading(true)
    loadMessages()
    const interval = setInterval(loadMessages, 10000)
    return () => clearInterval(interval)
  }, [loadMessages])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [listItems.length])

  async function handleSend(event) {
    event?.preventDefault()
    const body = draft.trim()
    if (!body || sending) return

    setSending(true)
    try {
      const result = await sendMessage(id, body)
      setMessages((prev) => [...prev, result.message])
      setDraft('')
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  async function handleAttach(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || sending) return

    setSending(true)
    try {
      const result = await sendMessageWithAttachment(id, file, draft.trim() || undefined)
      setMessages((prev) => [...prev, result.message])
      setDraft('')
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to send attachment')
    } finally {
      setSending(false)
    }
  }

  const otherName = otherParty?.name || 'Conversation'
  const productHref = product?.id ? `/${role}/products/${product.id}` : null

  return (
    <AppShell role={role} title="Messages">
      <button type="button" className="detail-back" onClick={() => navigate(`/${role}/messages`)}>
        ← All messages
      </button>

      <div className="chat-panel">
        <div className="chat-header">
          <div className="chat-header-avatar">
            {otherParty?.avatarUrl ? (
              <img src={otherParty.avatarUrl} alt="" />
            ) : (
              (otherName[0] || '?').toUpperCase()
            )}
          </div>
          <div className="chat-header-info">
            <div className="chat-header-name">{otherName}</div>
            {product ? (
              productHref ? (
                <Link to={productHref} className="chat-header-product">
                  {product.title}
                </Link>
              ) : (
                <span className="chat-header-product">{product.title}</span>
              )
            ) : null}
          </div>
          {product?.images?.[0] ? (
            <Link to={productHref || '#'} className="chat-header-thumb">
              <img src={getImageUrl(product.images[0])} alt="" />
            </Link>
          ) : null}
        </div>

        <div className="chat-body" ref={listRef}>
          {loading && messages.length === 0 ? (
            <div className="empty-state">
              <div className="app-spinner" aria-label="Loading" />
            </div>
          ) : listItems.length === 0 ? (
            <div className="chat-empty">
              <p>No messages yet. Say hello!</p>
            </div>
          ) : (
            listItems.map((item) => {
              if (item.type === 'date') {
                return (
                  <div key={item.id} className="chat-date-sep">
                    <span>{item.label}</span>
                  </div>
                )
              }

              const { message, isMine, isGrouped } = item
              return (
                <div
                  key={item.id}
                  className={`chat-bubble-row${isMine ? ' mine' : ''}${isGrouped ? ' grouped' : ''}`}
                >
                  <div className={`chat-bubble${isMine ? ' mine' : ''}`}>
                    {message.imageUrl ? (
                      <a
                        href={message.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="chat-bubble-image"
                      >
                        <img src={message.imageUrl} alt="Attachment" />
                      </a>
                    ) : null}
                    {message.fileUrl ? (
                      <a
                        href={message.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="chat-bubble-file"
                      >
                        <span className="chat-bubble-file-icon" aria-hidden="true">📎</span>
                        <span className="chat-bubble-file-name">
                          {message.fileName || 'Attachment'}
                        </span>
                      </a>
                    ) : null}
                    {message.body ? <p className="chat-bubble-text">{message.body}</p> : null}
                    <span className="chat-bubble-time">{formatMessageTime(message.createdAt)}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {error ? <p className="dash-error chat-error">{error}</p> : null}

        <form className="chat-composer" onSubmit={handleSend}>
          <input
            ref={fileInputRef}
            type="file"
            className="chat-file-input"
            onChange={handleAttach}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          />
          <button
            type="button"
            className="chat-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            aria-label="Attach file"
          >
            📎
          </button>
          <input
            type="text"
            className="chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message…"
            disabled={sending}
          />
          <button type="submit" className="chat-send-btn" disabled={sending || !draft.trim()}>
            {sending ? '…' : 'Send'}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
