import { apiFetch } from './api'

export function getSavedListings() {
  return apiFetch('/api/saved')
}

export function getSavedStatus(productId) {
  return apiFetch(`/api/saved/${productId}/status`)
}

export function toggleSavedListing(productId) {
  return apiFetch(`/api/saved/${productId}`, {
    method: 'POST',
  })
}
