const API_BASE = import.meta.env.VITE_API_URL || ''

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong')
  }
  return data
}

export function apiFetch(path, options = {}) {
  const { headers, ...rest } = options

  return fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  }).then(parseResponse)
}

export function getAuthMethods() {
  return apiFetch('/api/auth/methods')
}

export function sendOtp(email, intent = 'signin') {
  return apiFetch('/api/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ email, intent }),
  })
}

export function verifyOtp(email, otp, intent = 'signin') {
  return apiFetch('/api/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp, intent }),
  })
}

export async function getCurrentUser() {
  const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
  if (res.status === 401) return null
  return parseResponse(res)
}

export function logout() {
  return apiFetch('/api/auth/logout', { method: 'POST' })
}
