import Constants from 'expo-constants';
import { Platform } from 'react-native';

const fromEnv = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4369';

/**
 * Android emulator maps the host machine to 10.0.2.2.
 * Physical devices should use the machine LAN IP from EXPO_PUBLIC_API_URL.
 * localhost/127.0.0.1 inside Android is the device itself, not your PC.
 */
function resolveApiBase(url: string): string {
  if (Platform.OS !== 'android') {
    return url.replace(/\/$/, '');
  }

  const isEmulator = Constants.isDevice === false;

  if (__DEV__ && isEmulator) {
    try {
      const parsed = new URL(url);
      parsed.hostname = '10.0.2.2';
      return parsed.toString().replace(/\/$/, '');
    } catch {
      return 'http://10.0.2.2:4369';
    }
  }

  return url
    .replace(/\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/gi, '//10.0.2.2')
    .replace(/\/$/, '');
}

export const API_BASE = resolveApiBase(fromEnv);
