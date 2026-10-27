import { createLogger } from "./logger.js";

const msg91Logger = createLogger("msg91");

const MSG91_BASE_URL = "https://control.msg91.com";
export const PHONE_OTP_LENGTH = 4;
const OTP_EXPIRY_MINUTES = 10;
const REQUEST_TIMEOUT_MS = 15_000;

export class Msg91Error extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "Msg91Error";
    this.status = status;
  }
}

function getAuthKey() {
  return process.env.MSG91_AUTH_KEY?.trim() || "";
}

function getTemplateId() {
  return process.env.MSG91_OTP_TEMPLATE_ID?.trim() || "";
}

export function isMsg91Configured() {
  return Boolean(getAuthKey() && getTemplateId());
}

/** MSG91 wants the country code + number without "+" (e.g. 919876543210). */
function toMsg91Mobile(e164Phone) {
  return String(e164Phone || "").replace(/\D/g, "");
}

export function maskPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length <= 4) return digits ? "****" : "";
  return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
}

/** Never log the authkey or the OTP itself. */
function describeRequest(method, path, query) {
  const safeQuery = { ...query };
  if (safeQuery.mobile) safeQuery.mobile = maskPhone(safeQuery.mobile);
  if (safeQuery.otp) safeQuery.otp = "******";
  return { method, path, query: safeQuery };
}

function mapMsg91Message(message) {
  const text = String(message || "").toLowerCase();

  if (text.includes("expired")) {
    return { message: "OTP expired. Request a new code.", status: 400 };
  }
  if (text.includes("not match") || text.includes("invalid otp")) {
    return { message: "Invalid OTP. Please check the code and try again.", status: 400 };
  }
  if (text.includes("already verified")) {
    return { message: "This code was already used. Request a new code.", status: 400 };
  }
  if (text.includes("retry count maxed") || text.includes("max limit")) {
    return { message: "Too many resend attempts. Please try again later.", status: 429 };
  }
  if (text.includes("mobile") && (text.includes("empty") || text.includes("not numeric") || text.includes("invalid"))) {
    return { message: "Enter a valid mobile number.", status: 400 };
  }
  if (text.includes("authkey") || text.includes("auth key")) {
    return { message: "SMS service is misconfigured on the server.", status: 503 };
  }
  if (text.includes("template")) {
    return { message: "SMS template is misconfigured on the server.", status: 503 };
  }

  return { message: message || "SMS service error. Please try again.", status: 502 };
}

async function callMsg91(path, { method = "GET", query = {} } = {}) {
  const authKey = getAuthKey();
  if (!authKey) {
    throw new Msg91Error("Phone authentication is not configured on the server.", 503);
  }

  const url = new URL(path, MSG91_BASE_URL);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const startedAt = Date.now();
  const logContext = describeRequest(method, path, query);
  msg91Logger.info("request", logContext);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        authkey: authKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      ...(method === "POST" ? { body: "{}" } : {}),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    msg91Logger.error(`network error after ${Date.now() - startedAt}ms (${method} ${path})`, error);
    throw new Msg91Error("Could not reach the SMS service. Please try again.", 502);
  }

  const rawBody = await response.text();
  let data = null;
  try {
    data = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    data = null;
  }

  const responseContext = {
    ...logContext,
    httpStatus: response.status,
    ms: Date.now() - startedAt,
    response: data ?? rawBody.slice(0, 500),
  };

  // MSG91 returns HTTP 200 with `type: "error"` for wrong/expired codes, so check `type`.
  if (!response.ok || data?.type !== "success") {
    const { message, status } = mapMsg91Message(data?.message);
    msg91Logger.warn("response error", responseContext);
    throw new Msg91Error(message, response.status === 401 ? 503 : status);
  }

  msg91Logger.info("response ok", responseContext);
  return data;
}

export async function sendPhoneOtp(e164Phone) {
  const templateId = getTemplateId();
  if (!templateId) {
    throw new Msg91Error("Phone authentication is not configured on the server.", 503);
  }

  return callMsg91("/api/v5/otp", {
    method: "POST",
    query: {
      template_id: templateId,
      mobile: toMsg91Mobile(e164Phone),
      otp_length: PHONE_OTP_LENGTH,
      otp_expiry: OTP_EXPIRY_MINUTES,
    },
  });
}

export async function verifyPhoneOtp(e164Phone, otp) {
  return callMsg91("/api/v5/otp/verify", {
    query: {
      mobile: toMsg91Mobile(e164Phone),
      otp,
    },
  });
}

export async function resendPhoneOtp(e164Phone, retryType = "text") {
  return callMsg91("/api/v5/otp/retry", {
    query: {
      mobile: toMsg91Mobile(e164Phone),
      retrytype: retryType,
    },
  });
}
