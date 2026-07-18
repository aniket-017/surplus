import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MessageToast from '../components/messages/MessageToast'
import { useAuth } from './AuthContext'
import { notifyActiveThreadRefresh } from '../lib/chatCache'
import { getConversations } from '../lib/conversationsApi'
import {
  ensureNotificationPermission,
  hasAskedNotificationPermission,
  showBrowserNotification,
} from '../lib/webNotifications'

const MessageNotificationsContext = createContext(null)
const POLL_MS = 45000
const TOAST_MS = 6000

function previewText(conversation) {
  const body = conversation.lastMessage?.body?.trim()
  return body || 'New message'
}

function conversationTitle(conversation, role) {
  const name = conversation.otherParty?.name || 'Someone'
  const product = conversation.product?.title
  if (role === 'seller') return name
  return product || name
}

function activeConversationIdFromPath(pathname) {
  const match = pathname.match(/\/(?:buyer|seller)\/messages\/([^/]+)/)
  return match?.[1] || null
}

export function MessageNotificationsProvider({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState(null)

  const snapshotRef = useRef(null)
  const toastTimerRef = useRef(null)
  const role = user?.role === 'seller' ? 'seller' : 'buyer'

  const dismissToast = useCallback(() => {
    setToast(null)
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
  }, [])

  const showToast = useCallback(
    (next) => {
      setToast(next)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => {
        setToast(null)
        toastTimerRef.current = null
      }, TOAST_MS)
    },
    [],
  )

  const openConversation = useCallback(
    (conversationId) => {
      if (!conversationId || !user?.role) return
      dismissToast()
      navigate(`/${role}/messages/${conversationId}`)
    },
    [dismissToast, navigate, role, user?.role],
  )

  const notifyForConversation = useCallback(
    (conversation, pathname) => {
      const activeId = activeConversationIdFromPath(pathname)
      if (activeId && activeId === conversation.id) return

      const title = conversationTitle(conversation, role)
      const body = previewText(conversation)
      const payload = {
        id: conversation.id,
        conversationId: conversation.id,
        title,
        body,
      }

      showToast(payload)

      showBrowserNotification({
        title,
        body,
        tag: `surplus-msg-${conversation.id}`,
        onClick: () => openConversation(conversation.id),
      })
    },
    [openConversation, role, showToast],
  )

  const poll = useCallback(async () => {
    if (!user?.id || !user?.role) return

    try {
      const data = await getConversations()
      const conversations = data.conversations || []
      const totalUnread = conversations.reduce(
        (sum, conversation) => sum + (conversation.unreadCount || 0),
        0,
      )
      setUnreadCount(totalUnread)

      const nextSnapshot = new Map()
      for (const conversation of conversations) {
        nextSnapshot.set(conversation.id, {
          lastMessageAt: conversation.lastMessageAt,
          unreadCount: conversation.unreadCount || 0,
          senderId: conversation.lastMessage?.senderId || null,
        })
      }

      const previous = snapshotRef.current
      snapshotRef.current = nextSnapshot

      // First successful poll only establishes baseline — no spam on login.
      if (!previous) return

      for (const conversation of conversations) {
        const prev = previous.get(conversation.id)
        const last = conversation.lastMessage
        if (!last || last.senderId === user.id) continue

        const isNewConversation = !prev
        const isNewer =
          prev &&
          new Date(conversation.lastMessageAt).getTime() > new Date(prev.lastMessageAt).getTime()
        const unreadIncreased = prev && (conversation.unreadCount || 0) > prev.unreadCount

        if (isNewConversation || isNewer || unreadIncreased) {
          notifyForConversation(conversation, location.pathname)
          notifyActiveThreadRefresh(conversation.id)
        }
      }
    } catch {
      // Ignore transient poll errors.
    }
  }, [location.pathname, notifyForConversation, user?.id, user?.role])

  useEffect(() => {
    if (!user?.id || !user?.role) {
      snapshotRef.current = null
      setUnreadCount(0)
      dismissToast()
      return undefined
    }

    // Ask once after login so desktop notifications can work in background tabs.
    if (!hasAskedNotificationPermission()) {
      ensureNotificationPermission().catch(() => {})
    }

    poll()
    const interval = setInterval(poll, POLL_MS)
    return () => clearInterval(interval)
  }, [dismissToast, poll, user?.id, user?.role])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  // Keep tab title badge in sync.
  useEffect(() => {
    if (!user?.id) return undefined
    const base = document.title.replace(/^\(\d+\)\s*/, '')
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base
    return () => {
      document.title = document.title.replace(/^\(\d+\)\s*/, '')
    }
  }, [unreadCount, user?.id])

  const value = useMemo(
    () => ({
      unreadCount,
      refresh: poll,
      requestPermission: ensureNotificationPermission,
    }),
    [poll, unreadCount],
  )

  return (
    <MessageNotificationsContext.Provider value={value}>
      {children}
      <MessageToast
        toast={toast}
        onClose={dismissToast}
        onOpen={(item) => openConversation(item.conversationId)}
      />
    </MessageNotificationsContext.Provider>
  )
}

export function useMessageNotifications() {
  const context = useContext(MessageNotificationsContext)
  if (!context) {
    throw new Error('useMessageNotifications must be used within MessageNotificationsProvider')
  }
  return context
}
