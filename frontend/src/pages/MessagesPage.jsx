import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { getConversations } from '../lib/conversationsApi'
import { formatConversationTime } from '../lib/messageFormat'
import { getImageUrl } from '../lib/productsApi'

function getPreview(conversation) {
  const body = conversation.lastMessage?.body?.trim()
  return body || 'Inquiry sent'
}

function getRowTitle(conversation, role) {
  const productTitle = conversation.product?.title || 'Listing'
  if (role === 'seller') {
    const buyerName = conversation.otherParty?.name || 'Buyer'
    return `${buyerName} · ${productTitle}`
  }
  return productTitle
}

export default function MessagesPage({ role }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getConversations()
        if (!cancelled) {
          setConversations(data.conversations)
          setError('')
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load messages')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AppShell role={role} title="Messages">
      <div className="messages-head">
        <h2 className="messages-head-title">Messages</h2>
        <p className="messages-head-sub">
          {role === 'seller'
            ? 'Inquiries from buyers interested in your listings.'
            : 'Your conversations with sellers about listings.'}
        </p>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="app-spinner" aria-label="Loading" />
        </div>
      ) : error ? (
        <p className="dash-error">{error}</p>
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          <h3>No messages yet</h3>
          <p>
            {role === 'seller'
              ? 'When buyers send inquiries on your listings, they will show up here.'
              : 'Start a conversation by sending an inquiry from a listing.'}
          </p>
        </div>
      ) : (
        <div className="conversation-list">
          {conversations.map((conversation) => {
            const title = getRowTitle(conversation, role)
            const productImage = conversation.product?.images?.[0]
            const otherName = conversation.otherParty?.name || ''
            const isMineLast = conversation.lastMessage?.senderId === user?.id

            return (
              <button
                key={conversation.id}
                type="button"
                className="conversation-row"
                onClick={() => navigate(`/${role}/messages/${conversation.id}`)}
              >
                <div className="conversation-thumb">
                  {productImage ? (
                    <img src={getImageUrl(productImage)} alt="" />
                  ) : (
                    <span className="conversation-thumb-fallback">
                      {(otherName[0] || '?').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="conversation-body">
                  <div className="conversation-top">
                    <span className="conversation-name">{title}</span>
                    <span className="conversation-time">
                      {formatConversationTime(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <div className="conversation-preview">
                    {isMineLast ? <span className="conversation-preview-you">You: </span> : null}
                    {getPreview(conversation)}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
