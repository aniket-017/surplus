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
import { AppState, type AppStateStatus } from 'react-native';

import { useAuth } from '@/src/context/AuthContext';
import { setAdminUnreadForBadge } from '@/src/lib/badgeCounts';
import { getNotificationUnreadCount } from '@/src/lib/notificationsApi';
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponseAsync,
  getNotificationData,
  getNotificationsInboxRoute,
  isAdminNotification,
  isExpoGo,
  setAppBadgeCount,
} from '@/src/lib/notifications';

const POLL_INTERVAL_MS = 45000;

type AdminNotificationsContextValue = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
};

const AdminNotificationsContext = createContext<AdminNotificationsContextValue | null>(null);

export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [unreadCount, setUnreadCountState] = useState(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const roleRef = useRef(user?.role);

  useEffect(() => {
    roleRef.current = user?.role;
  }, [user?.role]);

  const applyUnreadCount = useCallback(async (count: number) => {
    setUnreadCountState(count);
    const combined = setAdminUnreadForBadge(count);
    await setAppBadgeCount(combined);
  }, []);

  const setUnreadCount = useCallback(
    (count: number) => {
      void applyUnreadCount(count);
    },
    [applyUnreadCount],
  );

  const refreshUnreadCount = useCallback(async () => {
    if (!token) {
      await applyUnreadCount(0);
      return;
    }

    try {
      const data = await getNotificationUnreadCount(token);
      await applyUnreadCount(data.unreadCount || 0);
    } catch {
      // Keep the last known count if the request fails.
    }
  }, [token, applyUnreadCount]);

  useEffect(() => {
    if (!token) {
      void applyUnreadCount(0);
      return;
    }

    refreshUnreadCount();

    const interval = setInterval(() => {
      if (appStateRef.current === 'active') {
        refreshUnreadCount();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
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
        if (!isAdminNotification(data)) return;
        refreshUnreadCount();
      });

      if (cancelled) {
        receivedSub?.remove();
        return;
      }

      responseSub = await addNotificationResponseReceivedListener((response) => {
        const data = getNotificationData(response.notification);
        if (!isAdminNotification(data)) return;

        const role =
          roleRef.current === 'seller' || roleRef.current === 'buyer'
            ? roleRef.current
            : 'buyer';
        router.push(getNotificationsInboxRoute(role) as never);
        refreshUnreadCount();
      });
    }

    attachListeners();

    return () => {
      cancelled = true;
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!token || isExpoGo()) return;

    let handled = false;

    getLastNotificationResponseAsync().then((response) => {
      if (!response || handled) return;
      handled = true;

      const data = getNotificationData(response.notification);
      if (!isAdminNotification(data)) return;

      const respondedAt = response.notification.date;
      if (typeof respondedAt === 'number' && Date.now() - respondedAt > 60_000) {
        return;
      }

      const role =
        roleRef.current === 'seller' || roleRef.current === 'buyer'
          ? roleRef.current
          : 'buyer';
      router.push(getNotificationsInboxRoute(role) as never);
    });
  }, [token]);

  const value = useMemo(
    () => ({
      unreadCount,
      refreshUnreadCount,
      setUnreadCount,
    }),
    [unreadCount, refreshUnreadCount, setUnreadCount],
  );

  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  if (!context) {
    throw new Error('useAdminNotifications must be used within AdminNotificationsProvider');
  }
  return context;
}

export function useAdminNotificationUnreadCount() {
  const context = useContext(AdminNotificationsContext);
  return context?.unreadCount ?? 0;
}
