/**
 * India-focused phone helpers for Firebase Phone Auth (E.164).
 */

const DIGITS_ONLY = /^\d+$/

export function normalizeIndianPhoneInput(raw) {
  return String(raw || '').replace(/[^\d+]/g, '')
}

/** Returns E.164 phone like +919876543210, or null if invalid. */
export function toE164Phone(raw) {
  const cleaned = normalizeIndianPhoneInput(raw).trim()

  if (!cleaned) {
    return null
  }

  let digits = cleaned
  if (digits.startsWith('+')) {
    digits = digits.slice(1)
  }

  if (!DIGITS_ONLY.test(digits)) {
    return null
  }

  // Accept 10-digit local Indian numbers
  if (digits.length === 10) {
    return `+91${digits}`
  }

  // Accept numbers already including country code 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`
  }

  // Accept full international with + already stripped (11–15 digits)
  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`
  }

  return null
}

export function formatPhoneForDisplay(e164) {
  if (e164?.startsWith('+91') && e164.length === 13) {
    const local = e164.slice(3)
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`
  }
  return e164 || ''
}
