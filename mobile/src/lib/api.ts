import type { UpdateProfilePayload, User, UserRole } from '@/src/types/auth';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

type ApiError = { error?: string };

async function parseResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  return parseResponse<T>(res);
}

export function verifyFirebasePhone(idToken: string) {
  return apiFetch<{ message: string; token: string; user: User }>('/api/auth/firebase/phone', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

/** Local Expo Go only — backend must have ALLOW_DEV_PHONE_BYPASS=true. */
export function verifyDevPhone(phone: string) {
  return apiFetch<{ message: string; token: string; user: User }>('/api/auth/dev/phone', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export function getCurrentUser(token: string) {
  return apiFetch<{ user: User }>('/api/auth/me', { token });
}

export function updateRole(token: string, role: UserRole) {
  return apiFetch<{ user: User }>('/api/auth/role', {
    method: 'PATCH',
    token,
    body: JSON.stringify({ role }),
  });
}

export function updateProfile(token: string, payload: UpdateProfilePayload) {
  return apiFetch<{ user: User }>('/api/auth/profile', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function logoutRequest(token: string) {
  return apiFetch<{ message: string }>('/api/auth/logout', {
    method: 'POST',
    token,
  });
}
