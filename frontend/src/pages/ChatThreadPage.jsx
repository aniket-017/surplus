import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppShell from '../components/AppShell'
import ChatImageLightbox from '../components/messages/ChatImageLightbox'
import { useAuth } from '../context/AuthContext'
import {
  getConversationMessages,
  sendMessage,
  sendMessageWithAttachment,
} from '../lib/conversationsApi'
import { buildMessageListItems, formatMessageTime } from '../lib/messageFormat'
import { getImageUrl } from '../lib/productsApi'

const MAX_PENDING_ATTACHMENTS = 10

function createPendingAttachment(file) {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
    file,
    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
  }
}

function revokeAttachmentPreview(attachment) {
  if (attachment?.previewUrl) {
    URL.revokeObjectURL(attachment.previewUrl)
  }
}

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
  const [pendingAttachments, setPendingAttachments] = useState([])
  const [sending, setSending] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const listRef = useRef(null)
  const fileInputRef = useRef(null)
  const pendingAttachmentsRef = useRef([])

  const listItems = useMemo(() => buildMessageListItems(messages, user?.id), [messages, user?.id])
  const imageUrls = useMemo(
    () => messages.map((message) => message.imageUrl).filter(Boolean),
    [messages],
  )
  const canSend = Boolean(draft.trim() || pendingAttachments.length)

  function openImageLightbox(imageUrl) {
    const index = imageUrls.indexOf(imageUrl)
    if (index >= 0) setLightboxIndex(index)
  }

  useEffect(() => {
    if (lightboxIndex === null) return
    if (imageUrls.length === 0) {
      setLightboxIndex(null)
      return
    }
    if (lightboxIndex >= imageUrls.length) {
      setLightboxIndex(imageUrls.length - 1)
    }
  }, [imageUrls, lightboxIndex])

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments
  }, [pendingAttachments])

  useEffect(() => {
    return () => {
      pendingAttachmentsRef.current.forEach(revokeAttachmentPreview)
    }
  }, [])

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

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return undefined

    const updateKeyboardInset = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      document.documentElement.style.setProperty('--keyboard-inset', `${inset}px`)
      if (inset > 0 && listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight
      }
    }

    vv.addEventListener('resize', updateKeyboardInset)
    vv.addEventListener('scroll', updateKeyboardInset)
    updateKeyboardInset()

    return () => {
      vv.removeEventListener('resize', updateKeyboardInset)
      vv.removeEventListener('scroll', updateKeyboardInset)
      document.documentElement.style.removeProperty('--keyboard-inset')
    }
  }, [])

  function handleAttach(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length || sending) return

    const remaining = MAX_PENDING_ATTACHMENTS - pendingAttachments.length
    if (remaining <= 0) {
      setError(`You can attach up to ${MAX_PENDING_ATTACHMENTS} files at a time`)
      return
    }

    const accepted = files.slice(0, remaining).map(createPendingAttachment)
    setPendingAttachments((prev) => [...prev, ...accepted])
    setError(
      files.length > remaining
        ? `Only ${MAX_PENDING_ATTACHMENTS} files can be attached at a time`
        : '',
    )
  }

  function removePendingAttachment(attachmentId) {
    setPendingAttachments((prev) => {
      const target = prev.find((item) => item.id === attachmentId)
      revokeAttachmentPreview(target)
      return prev.filter((item) => item.id !== attachmentId)
    })
  }

  async function handleSend(event) {
    event?.preventDefault()
    const body = draft.trim()
    if (sending || (!body && pendingAttachments.length === 0)) return

    const attachmentsToSend = pendingAttachments
    setSending(true)
    try {
      const sentMessages = []

      if (attachmentsToSend.length === 0) {
        const result = await sendMessage(id, body)
        sentMessages.push(result.message)
      } else {
        for (let index = 0; index < attachmentsToSend.length; index += 1) {
          const attachment = attachmentsToSend[index]
          const messageBody = index === 0 ? body || undefined : undefined
          const result = await sendMessageWithAttachment(id, attachment.file, messageBody)
          sentMessages.push(result.message)
        }
      }

      setMessages((prev) => [...prev, ...sentMessages])
      attachmentsToSend.forEach(revokeAttachmentPreview)
      setPendingAttachments([])
      setDraft('')
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to send message')
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
                      <button
                        type="button"
                        className="chat-bubble-image"
                        onClick={() => openImageLightbox(message.imageUrl)}
                      >
                        <img src={message.imageUrl} alt="Attachment" />
                      </button>
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
          {pendingAttachments.length > 0 ? (
            <div className="chat-attach-preview" aria-label="Selected attachments">
              {pendingAttachments.map((attachment) => (
                <div key={attachment.id} className="chat-attach-preview-item">
                  {attachment.previewUrl ? (
                    <img src={attachment.previewUrl} alt={attachment.file.name} />
                  ) : (
                    <div className="chat-attach-preview-file" title={attachment.file.name}>
                      <span aria-hidden="true">📄</span>
                      <span>{attachment.file.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="chat-attach-preview-remove"
                    onClick={() => removePendingAttachment(attachment.id)}
                    disabled={sending}
                    aria-label={`Remove ${attachment.file.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="chat-composer-row">
            <input
              ref={fileInputRef}
              type="file"
              className="chat-file-input"
              onChange={handleAttach}
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
              multiple
            />
            <button
              type="button"
              className="chat-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || pendingAttachments.length >= MAX_PENDING_ATTACHMENTS}
              aria-label="Attach files"
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
            <button type="submit" className="chat-send-btn" disabled={sending || !canSend}>
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </form>
      </div>

      {lightboxIndex !== null ? (
        <ChatImageLightbox
          images={imageUrls}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={setLightboxIndex}
        />
      ) : null}
    </AppShell>
  )
}
