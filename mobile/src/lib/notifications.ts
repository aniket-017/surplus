import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export type NotificationKind = 'GENERAL' | 'PROMOTION' | 'UPDATE' | 'ALERT';
export type NotificationActionType =
  | 'NONE'
  | 'PRODUCT'
  | 'CATEGORY'
  | 'EXPLORE'
  | 'URL'
  | 'SCREEN';

type AppRole = 'buyer' | 'seller';

export type NotificationAction = {
  actionType?: NotificationActionType | string | null;
  actionValue?: string | null;
};

export type MessageNotificationData = NotificationAction & {
  type?: string;
  conversationId?: string;
  notificationId?: string;
  recipientRole?: 'buyer' | 'seller' | string;
  unreadCount?: number;
  kind?: NotificationKind | string;
  imageUrl?: string;
};

type NotificationModule = typeof import('expo-notifications');
type NotificationSubscription = { remove: () => void };

let notificationsModule: NotificationModule | null | undefined;
let handlerConfigured = false;

/** Expo Go cannot register for remote push on Android (SDK 53+). */
export function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

async function getNotificationsModule(): Promise<NotificationModule | null> {
  if (isExpoGo()) {
    return null;
  }

  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  try {
    notificationsModule = await import('expo-notifications');

    if (!handlerConfigured && notificationsModule) {
      notificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerConfigured = true;
    }

    return notificationsModule;
  } catch (error) {
    console.warn('expo-notifications unavailable:', error);
    notificationsModule = null;
    return null;
  }
}

export function getNotificationData(notification: {
  request: { content: { data?: unknown } };
}): MessageNotificationData {
  const data = notification.request.content.data ?? {};
  return data as MessageNotificationData;
}

export async function ensureAndroidMessageChannel() {
  if (Platform.OS !== 'android') return;

  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#16A34A',
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('announcements', {
    name: 'Announcements',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#16A34A',
    sound: 'default',
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo()) {
    // Remote push tokens are unavailable in Expo Go; unread badges still work via polling.
    return null;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  await ensureAndroidMessageChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn('Expo projectId missing; cannot register for push notifications');
    return null;
  }

  try {
    const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
    return pushToken.data;
  } catch (error) {
    console.warn('Failed to get Expo push token:', error);
    return null;
  }
}

export async function setAppBadgeCount(count: number) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  try {
    await Notifications.setBadgeCountAsync(Math.max(0, count));
  } catch {
    // Badge APIs are unavailable on some platforms/simulators.
  }
}

export async function addNotificationReceivedListener(
  listener: (notification: { request: { content: { data?: unknown } } }) => void,
): Promise<NotificationSubscription | null> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;
  return Notifications.addNotificationReceivedListener(listener as never);
}

export async function addNotificationResponseReceivedListener(
  listener: (response: {
    notification: { date?: number; request: { content: { data?: unknown } } };
  }) => void,
): Promise<NotificationSubscription | null> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;
  return Notifications.addNotificationResponseReceivedListener(listener as never);
}

export async function getLastNotificationResponseAsync(): Promise<{
  notification: { date?: number; request: { content: { data?: unknown } } };
} | null> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;
  return Notifications.getLastNotificationResponseAsync();
}

export function getConversationRoute(
  conversationId: string,
  role: 'buyer' | 'seller' | null | undefined,
) {
  if (role === 'seller') {
    return `/(seller)/messages/${conversationId}` as const;
  }
  return {
    pathname: '/messages/[id]' as const,
    params: { id: conversationId },
  };
}

export function getNotificationsInboxRoute(role: 'buyer' | 'seller' | null | undefined) {
  if (role === 'seller') {
    return '/(seller)/notifications' as const;
  }
  return '/(buyer)/notifications' as const;
}

/** iOS reports notification dates in seconds, Android in milliseconds. */
export function isRecentNotificationResponse(date: number | undefined, maxAgeMs = 60_000) {
  if (typeof date !== 'number') return true;
  const dateMs = date < 1e12 ? date * 1000 : date;
  return Date.now() - dateMs <= maxAgeMs;
}

export function isAdminNotification(data: MessageNotificationData) {
  return data.type === 'admin_notification';
}

type ActionTarget = { role: AppRole; href: Href };

function resolveScreenTarget(screen: string, role: AppRole): ActionTarget | null {
  switch (screen) {
    case 'ADD_PRODUCT':
      return { role: 'seller', href: '/(seller)/add-product' };
    case 'MY_LISTINGS':
      return { role: 'seller', href: '/(seller)/(tabs)/listings' };
    case 'SAVED':
      return { role: 'buyer', href: '/(buyer)/saved' };
    case 'HOME':
      return { role, href: role === 'seller' ? '/(seller)/(tabs)' : '/(buyer)/(tabs)' };
    case 'MESSAGES':
      return {
        role,
        href: role === 'seller' ? '/(seller)/(tabs)/messages' : '/(buyer)/(tabs)/messages',
      };
    case 'PROFILE':
      return {
        role,
        href: role === 'seller' ? '/(seller)/(tabs)/profile' : '/(buyer)/(tabs)/profile',
      };
    default:
      return null;
  }
}

function resolveActionTarget(action: NotificationAction, role: AppRole): ActionTarget | null {
  const actionValue = action.actionValue?.trim() || '';

  switch (action.actionType) {
    case 'PRODUCT':
      return actionValue
        ? { role: 'buyer', href: { pathname: '/products/[id]', params: { id: actionValue } } }
        : null;
    case 'CATEGORY':
      return actionValue
        ? { role: 'buyer', href: { pathname: '/category/[name]', params: { name: actionValue } } }
        : null;
    case 'EXPLORE':
      return { role: 'buyer', href: '/(buyer)/(tabs)/categories' };
    case 'SCREEN':
      return resolveScreenTarget(actionValue.toUpperCase(), role);
    default:
      return null;
  }
}

/**
 * Screens belong to either buyer or seller mode. When the target is in the other mode the
 * app switches first (same as the Sell button); without `switchRole` it falls back to the inbox.
 */
export async function openNotificationAction(
  action: NotificationAction,
  role: 'buyer' | 'seller' | null | undefined,
  {
    fallbackToInbox = true,
    switchRole,
  }: { fallbackToInbox?: boolean; switchRole?: (role: AppRole) => Promise<void> } = {},
) {
  const currentRole: AppRole = role === 'seller' ? 'seller' : 'buyer';
  const actionValue = action.actionValue?.trim() || '';

  if (action.actionType === 'URL' && /^https:\/\//i.test(actionValue)) {
    await WebBrowser.openBrowserAsync(actionValue);
    return;
  }

  const target = resolveActionTarget(action, currentRole);
  console.log('[notif-debug] openNotificationAction', JSON.stringify({ action, currentRole, target, hasSwitch: !!switchRole }));

  if (target && target.role !== currentRole && switchRole) {
    try {
      await switchRole(target.role);
    } catch {
      if (fallbackToInbox) router.push(getNotificationsInboxRoute(currentRole) as never);
      return;
    }
  }

  if (target && (target.role === currentRole || switchRole)) {
    router.push(target.href);
    return;
  }

  if (fallbackToInbox) {
    router.push(getNotificationsInboxRoute(currentRole) as never);
  }
}
