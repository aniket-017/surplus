import { isFirebaseAuthConfigured } from "../lib/firebaseAdmin.js";

export function isGoogleAuthEnabled() {
  return !!(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

export function isOtpAuthEnabled() {
  return !!(
    process.env.SMTP_MAIL?.trim() &&
    process.env.SMTP_PASSWORD?.trim() &&
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_PORT?.trim()
  );
}

export function isPhoneAuthEnabled() {
  return isFirebaseAuthConfigured();
}

/** Public Firebase Web client config (safe to expose to the browser). */
export function getFirebaseWebConfig() {
  const apiKey = process.env.FIREBASE_WEB_API_KEY?.trim() || "";
  const authDomain = process.env.FIREBASE_WEB_AUTH_DOMAIN?.trim() || "";
  const projectId =
    process.env.FIREBASE_WEB_PROJECT_ID?.trim() ||
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    "";
  const appId = process.env.FIREBASE_WEB_APP_ID?.trim() || "";
  const messagingSenderId = process.env.FIREBASE_WEB_MESSAGING_SENDER_ID?.trim() || "";

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    ...(messagingSenderId ? { messagingSenderId } : {}),
  };
}

export function isFirebaseWebConfigured() {
  return Boolean(getFirebaseWebConfig());
}

export function getAuthMethods() {
  return {
    google: isGoogleAuthEnabled(),
    otp: isOtpAuthEnabled(),
    phone: isPhoneAuthEnabled() && isFirebaseWebConfigured(),
  };
}
