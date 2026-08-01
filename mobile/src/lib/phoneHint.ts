import { Platform } from 'react-native';

import { isExpoGo } from '@/src/lib/notifications';
import { toIndianLocalDigits } from '@/src/lib/phone';

/**
 * Opens Android Phone Number Hint picker when available.
 * Returns 10-digit local Indian digits for the input field, or null if
 * unavailable / cancelled / not applicable.
 */
export async function requestPhoneNumberHintLocal(): Promise<string | null> {
  // Native module is not in Expo Go — skip import entirely to avoid LogBox spam.
  if (Platform.OS !== 'android' || isExpoGo()) {
    return null;
  }

  try {
    const {
      isAvailableAsync,
      showPhoneNumberHintAsync,
    } = await import('expo-phone-number-hint');

    const available = await isAvailableAsync();
    if (!available) {
      return null;
    }

    const selected = await showPhoneNumberHintAsync();
    if (!selected) {
      return null;
    }

    return toIndianLocalDigits(selected);
  } catch {
    // Hint not linked, cancelled, or no numbers — fall back to manual entry.
    return null;
  }
}
