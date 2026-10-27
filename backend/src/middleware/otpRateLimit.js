import { createLogger } from "../lib/logger.js";
import { maskPhone } from "../lib/msg91.js";
import { toE164Phone } from "../lib/phone.js";

const rateLimitLogger = createLogger("otp-rate-limit");

const WINDOW_MS = 60 * 60 * 1000;
const SENDS_PER_PHONE = Number(process.env.OTP_SENDS_PER_HOUR) || 5;

function createOtpRateLimit({ scope, perPhone, perIp, message }) {
  const hitsByKey = new Map();

  function isLimited(key, max, now) {
    const recent = (hitsByKey.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
    if (recent.length) {
      hitsByKey.set(key, recent);
    } else {
      hitsByKey.delete(key);
    }
    return recent.length >= max;
  }

  function record(key, now) {
    hitsByKey.set(key, [...(hitsByKey.get(key) ?? []), now]);
  }

  return function otpRateLimit(req, res, next) {
    const now = Date.now();
    const phone = toE164Phone(req.body?.phone);
    const phoneKey = phone ? `${scope}:phone:${phone}` : null;
    const ipKey = `${scope}:ip:${req.ip}`;

    if ((phoneKey && isLimited(phoneKey, perPhone, now)) || isLimited(ipKey, perIp, now)) {
      rateLimitLogger.warn(`${scope} rate limited`, { phone: maskPhone(phone), ip: req.ip });
      return res.status(429).json({ error: message });
    }

    if (phoneKey) record(phoneKey, now);
    record(ipKey, now);
    next();
  };
}

export const otpSendRateLimit = createOtpRateLimit({
  scope: "send",
  perPhone: SENDS_PER_PHONE,
  perIp: SENDS_PER_PHONE * 4,
  message: "Too many OTP requests. Please try again in a while.",
});

export const otpVerifyRateLimit = createOtpRateLimit({
  scope: "verify",
  perPhone: 10,
  perIp: 40,
  message: "Too many incorrect attempts. Please try again in a while.",
});
