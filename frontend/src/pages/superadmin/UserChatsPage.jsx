import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  clearSuperadminConversation,
  clearSuperadminUserChats,
  getSuperadminConversationMessages,
  getSuperadminUserConversations,
} from '../../lib/api'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function messagePreview(message) {
  if (!message) return '—'
  if (message.body?.trim()) return message.body.trim()
  if (message.imageUrl) return 'Photo'
  if (message.fileUrl) return message.fileName || 'Document'
  return '—'
}

export default function UserChatsPage() {
  const { id: userId } = useParams()
  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const [selectedId, setSelectedId] = useState(null)
  const [threadMeta, setThreadMeta] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesPage, setMessagesPage] = useState(1)
  const [messagesHasMore, setMessagesHasMore] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState('')

  const loadConversations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSuperadminUserConversations(userId, { page, q: search })
      setUser(data.user)
      setConversations(data.conversations)
      setTotal(data.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, page, search])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  async function loadMessages(conversationId, nextPage = 1, { prepend = false } = {}) {
    setMessagesLoading(true)
    setMessagesError('')
    try {
      const data = await getSuperadminConversationMessages(conversationId, {
        page: nextPage,
        limit: 50,
      })
      setThreadMeta(data.conversation)
      setMessagesPage(nextPage)
      setMessagesHasMore(Boolean(data.hasMore))
      setMessages((prev) => (prepend ? [...data.messages, ...prev] : data.messages))
    } catch (err) {
      setMessagesError(err.message)
    } finally {
      setMessagesLoading(false)
    }
  }

  async function handleView(conversation) {
    setSelectedId(conversation.id)
    setMessages([])
    setThreadMeta(null)
    setMessagesPage(1)
    setMessagesHasMore(false)
    await loadMessages(conversation.id, 1)
  }

  async function handleLoadOlder() {
    if (!selectedId || !messagesHasMore || messagesLoading) return
    await loadMessages(selectedId, messagesPage + 1, { prepend: true })
  }

  async function handleClearConversation(conversation) {
    if (
      !window.confirm(
        `Clear chat for "${conversation.product?.title || 'this product'}" with ${
          conversation.counterpart?.email || 'the other user'
        }? This deletes the thread for both participants.`,
      )
    ) {
      return
    }

    setBusyId(conversation.id)
    setError('')
    try {
      await clearSuperadminConversation(conversation.id)
      if (selectedId === conversation.id) {
        setSelectedId(null)
        setThreadMeta(null)
        setMessages([])
      }
      await loadConversations()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleClearAll() {
    const label = user?.email || 'this user'
    if (
      !window.confirm(
        `Clear ALL chats for ${label}? This deletes every conversation for both participants and cannot be undone.`,
      )
    ) {
      return
    }

    setBusyId('all')
    setError('')
    try {
      await clearSuperadminUserChats(userId)
      setSelectedId(null)
      setThreadMeta(null)
      setMessages([])
      setQ('')
      const needsPageReset = page !== 1
      const needsSearchReset = search !== ''
      if (needsPageReset) setPage(1)
      if (needsSearchReset) setSearch('')
      if (!needsPageReset && !needsSearchReset) {
        await loadConversations()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div className="sa-page">
      <div className="dash-hero">
        <span className="dash-role-badge">SUPERADMIN</span>
        <h1>User chats</h1>
        <p>
          {user
            ? `Conversations for ${user.name || user.email}`
            : 'Browse and clear conversations for this user.'}
        </p>
      </div>

      <div className="sa-toolbar">
        <Link to="/superadmin/users" className="btn btn-outline">
          Back to users
        </Link>
        {user ? (
          <div className="sa-cell-stack" style={{ flex: 1 }}>
            <strong>{user.name || '—'}</strong>
            <span className="sa-muted">
              {user.email}
              {user.role ? ` · ${user.role}` : ''}
            </span>
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}
        <button
          type="button"
          className="btn btn-outline sa-danger-btn"
          disabled={busyId === 'all' || loading || total === 0}
          onClick={handleClearAll}
        >
          Clear all chats
        </button>
      </div>

      <form
        className="sa-toolbar"
        onSubmit={(event) => {
          event.preventDefault()
          setPage(1)
          setSearch(q.trim())
        }}
      >
        <input
          className="auth-input"
          type="search"
          placeholder="Search by product, counterpart name, or email"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {error && <p className="auth-error">{error}</p>}

      <div className="sa-chats-layout">
        <div className="dash-card sa-panel">
          {loading ? (
            <div className="empty-state">
              <div className="app-spinner" aria-label="Loading" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="sa-muted">No conversations found for this user.</p>
          ) : (
            <>
              <div className="sa-table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Counterpart</th>
                      <th>Product</th>
                      <th>Last message</th>
                      <th>Messages</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversations.map((conversation) => (
                      <tr
                        key={conversation.id}
                        className={selectedId === conversation.id ? 'sa-row-active' : undefined}
                      >
                        <td>
                          <div className="sa-cell-stack">
                            <strong>{conversation.counterpart?.name || '—'}</strong>
                            <span>{conversation.counterpart?.email || '—'}</span>
                            <span className="sa-muted">
                              User is {conversation.userRoleInChat}
                            </span>
                          </div>
                        </td>
                        <td>{conversation.product?.title || '—'}</td>
                        <td>
                          <div className="sa-preview">{conversation.lastMessagePreview || '—'}</div>
                        </td>
                        <td>{conversation.messageCount}</td>
                        <td>{formatDate(conversation.lastMessageAt)}</td>
                        <td>
                          <div className="sa-actions-stack">
                            <button
                              type="button"
                              className="btn btn-primary sa-action-btn"
                              disabled={busyId === conversation.id}
                              onClick={() => handleView(conversation)}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline sa-action-btn sa-danger-btn"
                              disabled={busyId === conversation.id}
                              onClick={() => handleClearConversation(conversation)}
                            >
                              Clear chat
                            </button>
                          </div>
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
                  Page {page} of {totalPages} · {total} chats
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

        <div className="dash-card sa-panel sa-thread-panel">
          <div className="sa-panel-header">
            <h2>Thread</h2>
            {threadMeta ? (
              <span className="sa-muted">
                {threadMeta.product?.title || 'Conversation'}
              </span>
            ) : null}
          </div>

          {!selectedId ? (
            <p className="sa-muted">Select a conversation and click View to read messages.</p>
          ) : (
            <>
              {threadMeta ? (
                <div className="sa-thread-meta">
                  <div>
                    <strong>Buyer:</strong> {threadMeta.buyer?.name || '—'} (
                    {threadMeta.buyer?.email || '—'})
                  </div>
                  <div>
                    <strong>Seller:</strong> {threadMeta.seller?.name || '—'} (
                    {threadMeta.seller?.email || '—'})
                  </div>
                </div>
              ) : null}

              {messagesError && <p className="auth-error">{messagesError}</p>}

              {messagesHasMore ? (
                <button
                  type="button"
                  className="btn btn-outline sa-action-btn"
                  disabled={messagesLoading}
                  onClick={handleLoadOlder}
                >
                  {messagesLoading ? 'Loading…' : 'Load older messages'}
                </button>
              ) : null}

              {messagesLoading && messages.length === 0 ? (
                <div className="empty-state">
                  <div className="app-spinner" aria-label="Loading" />
                </div>
              ) : messages.length === 0 ? (
                <p className="sa-muted">No messages in this conversation.</p>
              ) : (
                <div className="sa-thread-messages">
                  {messages.map((message) => (
                    <div key={message.id} className="sa-thread-message">
                      <div className="sa-thread-message-header">
                        <strong>{message.sender?.name || message.sender?.email || 'Unknown'}</strong>
                        <span className="sa-muted">{formatDate(message.createdAt)}</span>
                      </div>
                      {message.body ? <p>{message.body}</p> : null}
                      {message.imageUrl ? (
                        <a href={message.imageUrl} target="_blank" rel="noreferrer">
                          <img
                            src={message.imageUrl}
                            alt="Chat attachment"
                            className="sa-thread-image"
                          />
                        </a>
                      ) : null}
                      {message.fileUrl ? (
                        <a
                          href={message.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="sa-thread-file"
                        >
                          {message.fileName || 'Download file'}
                        </a>
                      ) : null}
                      {!message.body && !message.imageUrl && !message.fileUrl ? (
                        <p className="sa-muted">{messagePreview(message)}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
