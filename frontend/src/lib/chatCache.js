const threads = new Map()
let conversationsCache = null

const threadRefreshListeners = new Set()

let activeThreadId = null
let activeThreadRefresh = null

export function getCachedConversations() {
  return conversationsCache?.conversations ?? null
}

export function setCachedConversations(conversations) {
  conversationsCache = {
    conversations,
    fetchedAt: Date.now(),
  }
}

export function invalidateConversations() {
  conversationsCache = null
}

export function getCachedThread(conversationId) {
  return threads.get(conversationId) ?? null
}

export function setCachedThread(conversationId, data) {
  threads.set(conversationId, {
    messages: data.messages,
    conversation: data.conversation,
    fetchedAt: Date.now(),
    hasMoreOlder: data.hasMoreOlder ?? false,
  })
}

export function mergeThreadMessages(conversationId, incoming, options = {}) {
  const existing = threads.get(conversationId)
  if (!existing && !options.conversation) {
    return null
  }

  const baseMessages = existing?.messages ?? []
  const byId = new Map()

  if (options.prepend) {
    for (const message of incoming) byId.set(message.id, message)
    for (const message of baseMessages) byId.set(message.id, message)
  } else {
    for (const message of baseMessages) byId.set(message.id, message)
    for (const message of incoming) byId.set(message.id, message)
  }

  const messages = Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  const next = {
    messages,
    conversation: options.conversation ?? existing.conversation,
    fetchedAt: Date.now(),
    hasMoreOlder:
      typeof options.hasMoreOlder === 'boolean'
        ? options.hasMoreOlder
        : (existing?.hasMoreOlder ?? false),
  }

  threads.set(conversationId, next)
  return next
}

export function replaceOptimisticMessage(conversationId, tempId, confirmed) {
  const existing = threads.get(conversationId)
  if (!existing) return

  threads.set(conversationId, {
    ...existing,
    messages: existing.messages.map((message) =>
      message.id === tempId ? confirmed : message,
    ),
    fetchedAt: Date.now(),
  })
}

export function removeMessage(conversationId, messageId) {
  const existing = threads.get(conversationId)
  if (!existing) return

  threads.set(conversationId, {
    ...existing,
    messages: existing.messages.filter((message) => message.id !== messageId),
    fetchedAt: Date.now(),
  })
}

export function appendThreadMessage(conversationId, message) {
  mergeThreadMessages(conversationId, [message])
}

export function invalidateThread(conversationId) {
  threads.delete(conversationId)
}

export function setActiveThread(conversationId, refresh = null) {
  activeThreadId = conversationId
  activeThreadRefresh = refresh
}

export function notifyActiveThreadRefresh(conversationId) {
  if (activeThreadId === conversationId && activeThreadRefresh) {
    activeThreadRefresh()
  }
  for (const listener of threadRefreshListeners) {
    listener(conversationId)
  }
}

export function subscribeThreadRefresh(listener) {
  threadRefreshListeners.add(listener)
  return () => {
    threadRefreshListeners.delete(listener)
  }
}
