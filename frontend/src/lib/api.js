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

export function getFirebaseWebConfig() {
  return apiFetch('/api/auth/firebase-config')
}

export function verifyFirebasePhone(idToken) {
  return apiFetch('/api/auth/firebase/phone', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  })
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
  if (res.status === 401 || res.status === 403) return null
  return parseResponse(res)
}

export function logout() {
  return apiFetch('/api/auth/logout', { method: 'POST' })
}

export function updateProfile(payload) {
  return apiFetch('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function updateRole(role) {
  return apiFetch('/api/auth/role', {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

export function sendSuperadminOtp(email) {
  return apiFetch('/api/superadmin/otp/send', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function verifySuperadminOtp(email, otp) {
  return apiFetch('/api/superadmin/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })
}

export function getSuperadminOverview() {
  return apiFetch('/api/superadmin/overview')
}

export function getSuperadminUsers({ page = 1, limit = 20, q = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (q) params.set('q', q)
  return apiFetch(`/api/superadmin/users?${params}`)
}

export function banSuperadminUser(id, reason) {
  return apiFetch(`/api/superadmin/users/${id}/ban`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function unbanSuperadminUser(id) {
  return apiFetch(`/api/superadmin/users/${id}/unban`, {
    method: 'POST',
  })
}

export function deleteSuperadminUser(id) {
  return apiFetch(`/api/superadmin/users/${id}`, {
    method: 'DELETE',
  })
}

export function getSuperadminUserConversations(userId, { page = 1, limit = 20, q = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (q) params.set('q', q)
  return apiFetch(`/api/superadmin/users/${userId}/conversations?${params}`)
}

export function getSuperadminConversationMessages(conversationId, { page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return apiFetch(`/api/superadmin/conversations/${conversationId}/messages?${params}`)
}

export function clearSuperadminConversation(conversationId) {
  return apiFetch(`/api/superadmin/conversations/${conversationId}`, {
    method: 'DELETE',
  })
}

export function clearSuperadminUserChats(userId) {
  return apiFetch(`/api/superadmin/users/${userId}/conversations`, {
    method: 'DELETE',
  })
}

export function getSuperadminProducts({ page = 1, limit = 20, q = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (q) params.set('q', q)
  return apiFetch(`/api/superadmin/products?${params}`)
}

export function deleteSuperadminProduct(id) {
  return apiFetch(`/api/superadmin/products/${id}`, {
    method: 'DELETE',
  })
}

export function getSuperadminReports({ page = 1, limit = 20, q = '', status = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (q) params.set('q', q)
  if (status) params.set('status', status)
  return apiFetch(`/api/superadmin/reports?${params}`)
}

export function updateSuperadminReport(id, status) {
  return apiFetch(`/api/superadmin/reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function getSuperadminNotifications({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return apiFetch(`/api/superadmin/notifications?${params}`)
}

export function sendSuperadminNotification({ title, body, audience, targetUserIds = [] }) {
  return apiFetch('/api/superadmin/notifications', {
    method: 'POST',
    body: JSON.stringify({ title, body, audience, targetUserIds }),
  })
}

export function getSuperadmins() {
  return apiFetch('/api/superadmin/admins')
}

export function addSuperadmin(email) {
  return apiFetch('/api/superadmin/admins', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function revokeSuperadmin(id) {
  return apiFetch(`/api/superadmin/admins/${id}`, {
    method: 'DELETE',
  })
}

export function getSuperadminReferralCodes() {
  return apiFetch('/api/superadmin/referral-codes')
}

export function createSuperadminReferralCode({ code, label }) {
  return apiFetch('/api/superadmin/referral-codes', {
    method: 'POST',
    body: JSON.stringify({ code, label }),
  })
}

export function updateSuperadminReferralCode(id, payload) {
  return apiFetch(`/api/superadmin/referral-codes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getSuperadminReferralCodeUsers(id, { page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return apiFetch(`/api/superadmin/referral-codes/${id}/users?${params}`)
}
