import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type MessageNotificationData = {
  type?: string;
  conversationId?: string;
  recipientRole?: 'buyer' | 'seller' | string;
  unreadCount?: number;
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
