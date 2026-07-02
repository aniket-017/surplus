const API_BASE = import.meta.env.VITE_API_URL || ''

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong')
  }
  return data
}

export async function startInquiry(productId, message) {
  const res = await fetch(`${API_BASE}/api/conversations`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, message: message?.trim() || undefined }),
  })
  return parseResponse(res)
}

export async function getConversations() {
  const res = await fetch(`${API_BASE}/api/conversations`, {
    credentials: 'include',
  })
  return parseResponse(res)
}

export async function getConversationMessages(conversationId) {
  const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, {
    credentials: 'include',
  })
  return parseResponse(res)
}

export async function sendMessage(conversationId, body) {
  const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })
  return parseResponse(res)
}

export async function sendMessageWithAttachment(conversationId, file, body) {
  const formData = new FormData()
  formData.append('attachment', file)
  formData.append('fileName', file.name)
  const trimmed = body?.trim()
  if (trimmed) formData.append('body', trimmed)

  const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  return parseResponse(res)
}
