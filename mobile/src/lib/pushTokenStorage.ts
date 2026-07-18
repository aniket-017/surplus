import * as SecureStore from 'expo-secure-store';

const PUSH_TOKEN_KEY = 'surplus_push_token';

export async function loadStoredPushToken() {
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

export async function saveStoredPushToken(token: string) {
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
}

export async function clearStoredPushToken() {
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}
