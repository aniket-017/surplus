/** Returns an Indian mobile number as E.164 (+919876543210), or null if invalid. */
export function toE164Phone(raw) {
  if (typeof raw !== "string" && typeof raw !== "number") {
    return null;
  }

  let digits = String(raw).replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return null;
  }

  return `+91${digits}`;
}
