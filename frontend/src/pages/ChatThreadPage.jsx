import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppShell from '../components/AppShell'
import ChatImageLightbox from '../components/messages/ChatImageLightbox'
import MessageInfoModal from '../components/messages/MessageInfoModal'
import MessageReceipt from '../components/messages/MessageReceipt'
import { useAuth } from '../context/AuthContext'
import { useMessageNotifications } from '../context/MessageNotificationsContext'
import {
  appendThreadMessage,
  getCachedThread,
  mergeThreadMessages,
  removeMessage,
  replaceOptimisticMessage,
  setActiveThread,
  setCachedThread,
} from '../lib/chatCache'
import {
  getConversationMessages,
  markConversationAsRead,
  sendMessage,
  sendMessageWithAttachment,
} from '../lib/conversationsApi'
import { buildMessageListItems, formatMessageTime } from '../lib/messageFormat'
import { getImageUrl } from '../lib/productsApi'

const MAX_PENDING_ATTACHMENTS = 10
const PAGE_SIZE = 30
const POLL_INTERVAL_MS = 10000

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
  const { refresh: refreshUnread } = useMessageNotifications()

  const cached = id ? getCachedThread(id) : null
  const [messages, setMessages] = useState(cached?.messages ?? [])
  const [product, setProduct] = useState(cached?.conversation?.product ?? null)
  const [otherParty, setOtherParty] = useState(cached?.conversation?.otherParty ?? null)
  const [loading, setLoading] = useState(!cached)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMoreOlder, setHasMoreOlder] = useState(cached?.hasMoreOlder ?? false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState([])
  const [sending, setSending] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [infoMessage, setInfoMessage] = useState(null)

  const listRef = useRef(null)
  const fileInputRef = useRef(null)
  const pendingAttachmentsRef = useRef([])
  const longPressTimerRef = useRef(null)
  const messagesRef = useRef(messages)
  const loadingOlderRef = useRef(false)

  const listItems = useMemo(() => buildMessageListItems(messages, user?.id), [messages, user?.id])
  const imageUrls = useMemo(
    () => messages.map((message) => message.imageUrl).filter(Boolean),
    [messages],
  )
  const canSend = Boolean(draft.trim() || pendingAttachments.length)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

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
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const nextCached = id ? getCachedThread(id) : null
    if (nextCached) {
      setMessages(nextCached.messages)
      setProduct(nextCached.conversation.product)
      setOtherParty(nextCached.conversation.otherParty)
      setHasMoreOlder(nextCached.hasMoreOlder)
      setLoading(false)
    } else {
      setMessages([])
      setProduct(null)
      setOtherParty(null)
      setHasMoreOlder(false)
      setLoading(true)
    }
    setError('')
    setDraft('')
    setPendingAttachments((prev) => {
      prev.forEach(revokeAttachmentPreview)
      return []
    })
  }, [id])

  const applyThreadData = useCallback(
    (data, mode) => {
      if (!id) return

      if (mode === 'replace') {
        setCachedThread(id, {
          messages: data.messages,
          conversation: data.conversation,
          hasMoreOlder: Boolean(data.hasMoreOlder),
        })
        setMessages(data.messages)
        setHasMoreOlder(Boolean(data.hasMoreOlder))
      } else if (mode === 'prepend') {
        const merged = mergeThreadMessages(id, data.messages, {
          prepend: true,
          hasMoreOlder: Boolean(data.hasMoreOlder),
          conversation: data.conversation,
        })
        if (merged) {
          setMessages(merged.messages)
          setHasMoreOlder(merged.hasMoreOlder)
        }
      } else {
        const merged = mergeThreadMessages(id, data.messages, {
          conversation: data.conversation,
        })
        if (merged) {
          setMessages(merged.messages)
        } else {
          setCachedThread(id, {
            messages: data.messages,
            conversation: data.conversation,
            hasMoreOlder: Boolean(data.hasMoreOlder),
          })
          setMessages(data.messages)
          setHasMoreOlder(Boolean(data.hasMoreOlder))
        }
      }

      setProduct(data.conversation.product)
      setOtherParty(data.conversation.otherParty)
      setError('')
    },
    [id],
  )

  const loadMessages = useCallback(
    async (mode = 'full') => {
      if (!id) return

      try {
        if (mode === 'delta') {
          const last = [...messagesRef.current]
            .reverse()
            .find((message) => !String(message.id).startsWith('temp-'))
          if (!last) {
            const data = await getConversationMessages(id, { limit: PAGE_SIZE })
            applyThreadData(data, 'replace')
          } else {
            const data = await getConversationMessages(id, {
              after: last.id,
              limit: PAGE_SIZE,
            })
            if (data.messages.length > 0) {
              applyThreadData(data, 'merge')
            }
          }
        } else {
          const data = await getConversationMessages(id, { limit: PAGE_SIZE })
          applyThreadData(data, 'replace')
        }

        markConversationAsRead(id).catch(() => {})
        refreshUnread()
      } catch (err) {
        if (messagesRef.current.length === 0) {
          setError(err.message || 'Failed to load messages')
        }
      } finally {
        setLoading(false)
      }
    },
    [id, refreshUnread, applyThreadData],
  )

  const loadOlderMessages = useCallback(async () => {
    if (!id || !hasMoreOlder || loadingOlderRef.current) return
    const oldest = messagesRef.current.find(
      (message) => !String(message.id).startsWith('temp-'),
    )
    if (!oldest) return

    loadingOlderRef.current = true
    setLoadingOlder(true)
    const previousHeight = listRef.current?.scrollHeight || 0
    try {
      const data = await getConversationMessages(id, {
        before: oldest.id,
        limit: PAGE_SIZE,
      })
      applyThreadData(data, 'prepend')
      requestAnimationFrame(() => {
        if (listRef.current) {
          const nextHeight = listRef.current.scrollHeight
          listRef.current.scrollTop = nextHeight - previousHeight
        }
      })
    } catch {
      // Keep current messages if older page fails.
    } finally {
      loadingOlderRef.current = false
      setLoadingOlder(false)
    }
  }, [id, hasMoreOlder, applyThreadData])

  useEffect(() => {
    if (!infoMessage) return
    const fresh = messages.find((message) => message.id === infoMessage.id)
    if (
      fresh &&
      (fresh.status !== infoMessage.status ||
        fresh.deliveredAt !== infoMessage.deliveredAt ||
        fresh.readAt !== infoMessage.readAt)
    ) {
      setInfoMessage(fresh)
    }
  }, [messages, infoMessage])

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  function openMessageInfo(message, isMine) {
    if (!isMine) return
    setInfoMessage(message)
  }

  function handleBubbleContextMenu(event, message, isMine) {
    if (!isMine) return
    event.preventDefault()
    openMessageInfo(message, true)
  }

  function handleBubblePointerDown(message, isMine) {
    if (!isMine) return
    clearLongPressTimer()
    longPressTimerRef.current = setTimeout(() => {
      openMessageInfo(message, true)
    }, 400)
  }

  useEffect(() => {
    void loadMessages('full')
    const interval = setInterval(() => {
      void loadMessages('delta')
    }, POLL_INTERVAL_MS)

    setActiveThread(id, () => {
      void loadMessages('delta')
    })

    return () => {
      clearInterval(interval)
      setActiveThread(null, null)
    }
  }, [loadMessages, id])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [listItems.length, loading])

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

  function handleChatScroll(event) {
    if (event.currentTarget.scrollTop < 80) {
      void loadOlderMessages()
    }
  }

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

    if (attachmentsToSend.length === 0) {
      const tempId = `temp-${Date.now()}`
      const optimistic = {
        id: tempId,
        conversationId: id,
        senderId: user?.id || '',
        body,
        imageUrl: null,
        fileUrl: null,
        fileName: null,
        createdAt: new Date().toISOString(),
        status: 'sent',
      }

      setDraft('')
      setMessages((prev) => {
        const next = [...prev, optimistic]
        appendThreadMessage(id, optimistic)
        return next
      })

      try {
        const result = await sendMessage(id, body)
        setMessages((prev) => {
          const next = prev.map((message) =>
            message.id === tempId ? result.message : message,
          )
          replaceOptimisticMessage(id, tempId, result.message)
          return next
        })
        setError('')
      } catch (err) {
        setMessages((prev) => {
          const next = prev.filter((message) => message.id !== tempId)
          removeMessage(id, tempId)
          return next
        })
        setDraft(body)
        setError(err.message || 'Failed to send message')
      } finally {
        setSending(false)
      }
      return
    }

    try {
      const sentMessages = []
      for (let index = 0; index < attachmentsToSend.length; index += 1) {
        const attachment = attachmentsToSend[index]
        const messageBody = index === 0 ? body || undefined : undefined
        const result = await sendMessageWithAttachment(id, attachment.file, messageBody)
        sentMessages.push(result.message)
      }

      setMessages((prev) => {
        const next = [...prev, ...sentMessages]
        sentMessages.forEach((message) => appendThreadMessage(id, message))
        return next
      })
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

        <div className="chat-body" ref={listRef} onScroll={handleChatScroll}>
          {loadingOlder ? (
            <div className="chat-empty" style={{ padding: '8px 0' }}>
              <div className="app-spinner" aria-label="Loading older messages" />
            </div>
          ) : null}
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
                  <div
                    className={`chat-bubble${isMine ? ' mine' : ''}${isMine ? ' chat-bubble--receipt' : ''}`}
                    onContextMenu={(event) => handleBubbleContextMenu(event, message, isMine)}
                    onPointerDown={() => handleBubblePointerDown(message, isMine)}
                    onPointerUp={clearLongPressTimer}
                    onPointerLeave={clearLongPressTimer}
                    onPointerCancel={clearLongPressTimer}
                  >
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
                    <span className="chat-bubble-meta">
                      <span className="chat-bubble-time">{formatMessageTime(message.createdAt)}</span>
                      {isMine ? <MessageReceipt status={message.status} /> : null}
                    </span>
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

      {infoMessage ? (
        <MessageInfoModal message={infoMessage} onClose={() => setInfoMessage(null)} />
      ) : null}
    </AppShell>
  )
}
