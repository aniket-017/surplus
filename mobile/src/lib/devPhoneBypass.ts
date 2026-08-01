import { isExpoGo } from '@/src/lib/notifications';
import { toE164Phone } from '@/src/lib/phone';

/** Default allowlisted local number for Expo Go development. */
export const DEV_BYPASS_LOCAL_PHONE = '8788896643';

const DEFAULT_E164 = `+91${DEV_BYPASS_LOCAL_PHONE}`;

function configuredBypassPhones(): Set<string> {
  const raw =
    process.env.EXPO_PUBLIC_DEV_PHONE_BYPASS_NUMBERS?.trim() || DEFAULT_E164;
  return new Set(
    raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

/**
 * Dev phone bypass for Expo Go (no RNFirebase).
 * Enabled when EXPO_PUBLIC_DEV_PHONE_BYPASS=1, or automatically in Expo Go + __DEV__.
 */
export function isDevPhoneBypassEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_DEV_PHONE_BYPASS === '1') {
    return true;
  }
  return Boolean(__DEV__ && isExpoGo());
}

export function isDevBypassPhone(rawPhone: string): boolean {
  const e164 = toE164Phone(rawPhone);
  if (!e164) {
    return false;
  }
  return configuredBypassPhones().has(e164);
}
