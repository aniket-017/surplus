import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { useAuth } from '@/src/context/AuthContext';
import { notifyActiveThreadRefresh } from '@/src/lib/chatCache';
import { setMessageUnreadForBadge } from '@/src/lib/badgeCounts';
import {
  getUnreadCount,
  markConversationAsRead,
  registerPushToken,
} from '@/src/lib/conversationsApi';
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getConversationRoute,
  getLastNotificationResponseAsync,
  getNotificationData,
  isAdminNotification,
  isExpoGo,
  registerForPushNotificationsAsync,
  setAppBadgeCount,
} from '@/src/lib/notifications';
import { saveStoredPushToken } from '@/src/lib/pushTokenStorage';

const POLL_INTERVAL_MS = 45000;

type UnreadMessagesContextValue = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
};

const UnreadMessagesContext = createContext<UnreadMessagesContextValue | null>(null);

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const roleRef = useRef(user?.role);

  useEffect(() => {
    roleRef.current = user?.role;
  }, [user?.role]);

  const applyUnreadCount = useCallback(async (count: number) => {
    setUnreadCount(count);
    const combined = setMessageUnreadForBadge(count);
    await setAppBadgeCount(combined);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!token) {
      await applyUnreadCount(0);
      return;
    }

    try {
      const data = await getUnreadCount(token);
      await applyUnreadCount(data.unreadCount || 0);
    } catch {
      // Keep the last known count if the request fails.
    }
  }, [token, applyUnreadCount]);

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      if (!token || !conversationId) return;

      try {
        const data = await markConversationAsRead(token, conversationId);
        await applyUnreadCount(data.unreadCount || 0);
      } catch {
        await refreshUnreadCount();
      }
    },
    [token, refreshUnreadCount, applyUnreadCount],
  );

  useEffect(() => {
    if (!token) {
      void applyUnreadCount(0);
      return;
    }

    let cancelled = false;

    async function registerDevice() {
      if (isExpoGo()) return;

      const pushToken = await registerForPushNotificationsAsync();
      if (!pushToken || cancelled || !token) return;

      await saveStoredPushToken(pushToken);

      try {
        await registerPushToken(token, pushToken, Platform.OS);
      } catch (error) {
        console.warn('Failed to register push token with backend:', error);
      }
    }

    registerDevice();
    refreshUnreadCount();

    const interval = setInterval(() => {
      if (appStateRef.current === 'active') {
        refreshUnreadCount();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, refreshUnreadCount, applyUnreadCount]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState;
      if (nextState === 'active' && token) {
        refreshUnreadCount();
      }
    });

    return () => subscription.remove();
  }, [token, refreshUnreadCount]);

  useEffect(() => {
    if (isExpoGo()) return;

    let receivedSub: { remove: () => void } | null = null;
    let responseSub: { remove: () => void } | null = null;
    let cancelled = false;

    async function attachListeners() {
      receivedSub = await addNotificationReceivedListener((notification) => {
        const data = getNotificationData(notification);
        if (isAdminNotification(data)) return;

        if (typeof data.unreadCount === 'number') {
          void applyUnreadCount(data.unreadCount);
        } else {
          refreshUnreadCount();
        }

        if (typeof data.conversationId === 'string' && data.conversationId) {
          notifyActiveThreadRefresh(data.conversationId);
        }
      });

      if (cancelled) {
        receivedSub?.remove();
        return;
      }

      responseSub = await addNotificationResponseReceivedListener((response) => {
        const data = getNotificationData(response.notification);
        if (isAdminNotification(data)) return;
        if (!data.conversationId) return;

        const role =
          data.recipientRole === 'seller' || data.recipientRole === 'buyer'
            ? data.recipientRole
            : roleRef.current;

        const route = getConversationRoute(data.conversationId, role);
        router.push(route as never);
        refreshUnreadCount();
      });
    }

    attachListeners();

    return () => {
      cancelled = true;
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, [refreshUnreadCount, applyUnreadCount]);

  useEffect(() => {
    if (!token || isExpoGo()) return;

    let handled = false;

    getLastNotificationResponseAsync().then((response) => {
      if (!response || handled) return;
      handled = true;

      const data = getNotificationData(response.notification);
      if (isAdminNotification(data)) return;
      if (!data.conversationId) return;

      // Only open chats from taps that happened in the last 60 seconds
      // to avoid replaying an old notification on every app launch.
      const respondedAt = response.notification.date;
      if (typeof respondedAt === 'number' && Date.now() - respondedAt > 60_000) {
        return;
      }

      const role =
        data.recipientRole === 'seller' || data.recipientRole === 'buyer'
          ? data.recipientRole
          : roleRef.current;

      const route = getConversationRoute(data.conversationId, role);
      router.push(route as never);
    });
  }, [token]);

  const value = useMemo(
    () => ({
      unreadCount,
      refreshUnreadCount,
      markConversationRead,
    }),
    [unreadCount, refreshUnreadCount, markConversationRead],
  );

  return (
    <UnreadMessagesContext.Provider value={value}>{children}</UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider');
  }
  return context;
}

/** Safe hook for optional badge use outside provider (returns 0). */
export function useUnreadCount() {
  const context = useContext(UnreadMessagesContext);
  return context?.unreadCount ?? 0;
}
