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

export function getAuthMethods() {
  return {
    google: isGoogleAuthEnabled(),
    otp: isOtpAuthEnabled(),
  };
}
