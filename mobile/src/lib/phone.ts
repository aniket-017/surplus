/**
 * India-focused phone helpers for Firebase Phone Auth (E.164).
 */

const DIGITS_ONLY = /^\d+$/;

export function normalizeIndianPhoneInput(raw: string): string {
  return raw.replace(/[^\d+]/g, '');
}

/** Returns E.164 phone like +919876543210, or null if invalid. */
export function toE164Phone(raw: string): string | null {
  const cleaned = normalizeIndianPhoneInput(raw).trim();

  if (!cleaned) {
    return null;
  }

  let digits = cleaned;
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }

  if (!DIGITS_ONLY.test(digits)) {
    return null;
  }

  // Accept 10-digit local Indian numbers
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // Accept numbers already including country code 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  // Accept full international with + already stripped (11–15 digits)
  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

/** Extract 10-digit Indian local number from E.164 or raw input for the auth field. */
export function toIndianLocalDigits(raw: string): string | null {
  const e164 = toE164Phone(raw);
  if (!e164) {
    return null;
  }

  if (e164.startsWith('+91') && e164.length === 13) {
    return e164.slice(3);
  }

  const digits = e164.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }

  return null;
}

export function formatPhoneForDisplay(e164: string): string {
  if (e164.startsWith('+91') && e164.length === 13) {
    const local = e164.slice(3);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return e164;
}
