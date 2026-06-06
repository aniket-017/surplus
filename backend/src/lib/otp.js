import crypto from "crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;

export function generateOtp() {
  return crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
}

export function hashOtp(email, code) {
  return crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`${email.toLowerCase()}:${code}`)
    .digest("hex");
}

export function getOtpExpiry() {
  return new Date(Date.now() + OTP_TTL_MS);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
