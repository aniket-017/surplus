import { API_BASE } from '@/src/lib/apiBase';

type ApiError = { error?: string };

export type InboxNotification = {
  id: string;
  notificationId: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

async function parseResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export async function getNotifications(
  token: string,
  { page = 1, limit = 20 }: { page?: number; limit?: number } = {},
) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/notifications?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<{
    notifications: InboxNotification[];
    total: number;
    page: number;
    limit: number;
  }>(res);
}

export async function getNotificationUnreadCount(token: string) {
  const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<{ unreadCount: number }>(res);
}

export async function markNotificationRead(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<{ notification: InboxNotification }>(res);
}

export async function markAllNotificationsRead(token: string) {
  const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<{ success: boolean; updatedCount: number }>(res);
}
