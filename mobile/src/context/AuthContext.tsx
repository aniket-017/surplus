import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  getCurrentUser,
  logoutRequest,
  updateProfile as updateProfileRequest,
  updateRole,
  verifyFirebasePhone,
} from '@/src/lib/api';
import { signOutFirebaseAuth } from '@/src/lib/firebaseAuth';
import { unregisterPushToken } from '@/src/lib/conversationsApi';
import { clearStoredPushToken, loadStoredPushToken } from '@/src/lib/pushTokenStorage';
import type { UpdateProfilePayload, User, UserRole } from '@/src/types/auth';

const TOKEN_KEY = 'surplus_auth_token';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signInWithPhone: (idToken: string) => Promise<User>;
  signOut: () => Promise<void>;
  setRole: (role: UserRole) => Promise<User>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function saveToken(token: unknown) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error(
      'Sign-in succeeded but no auth token was returned. Restart the backend server and try again.',
    );
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const storedToken = await loadToken();

    if (!storedToken) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await getCurrentUser(storedToken);
      setToken(storedToken);
      setUser(data.user);
    } catch {
      await clearToken();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signInWithPhone = useCallback(async (idToken: string) => {
    const data = await verifyFirebasePhone(idToken);

    if (!data.user) {
      throw new Error('Sign-in failed. Please try again.');
    }

    await saveToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    if (token) {
      try {
        const pushToken = await loadStoredPushToken();
        if (pushToken) {
          await unregisterPushToken(token, pushToken);
        }
      } catch {
        // Ignore push unregister failures during logout.
      }

      try {
        await logoutRequest(token);
      } catch {
        // Ignore logout API errors and clear local session anyway.
      }
    }

    try {
      await signOutFirebaseAuth();
    } catch {
      // Ignore Firebase sign-out errors.
    }

    await clearStoredPushToken();
    await clearToken();
    setToken(null);
    setUser(null);
  }, [token]);

  const setRole = useCallback(
    async (role: UserRole) => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      const data = await updateRole(token, role);
      setUser(data.user);
      return data.user;
    },
    [token],
  );

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload) => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      const data = await updateProfileRequest(token, payload);
      setUser(data.user);
      return data.user;
    },
    [token],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      signInWithPhone,
      signOut,
      setRole,
      updateProfile,
      refreshUser,
    }),
    [user, token, loading, signInWithPhone, signOut, setRole, updateProfile, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
