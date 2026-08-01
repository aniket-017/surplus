import { Platform } from 'react-native';

import { isExpoGo } from '@/src/lib/notifications';

const OTP_DIGITS = /\b(\d{6})\b/;

export function extractOtpFromSms(message: string): string | null {
  const match = message.match(OTP_DIGITS);
  return match?.[1] ?? null;
}

/**
 * Starts Android SMS User Consent listening for an incoming OTP SMS.
 * Returns a cleanup function. No-op on iOS / Expo Go.
 */
export function startOtpSmsConsent(onOtp: (otp: string) => void): () => void {
  if (Platform.OS !== 'android' || isExpoGo()) {
    return () => {};
  }

  let cancelled = false;
  let subscription: { remove: () => void } | undefined;
  let stopListening: (() => void) | undefined;

  (async () => {
    try {
      const {
        startSmsUserConsent,
        addSmsListener,
        removeSmsListener,
      } = await import('expo-otp-autofill-consent');

      if (cancelled) {
        return;
      }

      stopListening = removeSmsListener;
      await startSmsUserConsent();

      if (cancelled) {
        removeSmsListener();
        return;
      }

      subscription = addSmsListener((event) => {
        const otp = extractOtpFromSms(event.message ?? '');
        if (otp) {
          onOtp(otp);
        }
      });
    } catch {
      // Module not linked, cancelled, or Play Services unavailable — manual entry still works.
    }
  })();

  return () => {
    cancelled = true;
    subscription?.remove();
    try {
      stopListening?.();
    } catch {
      // Ignore cleanup errors.
    }
  };
}
