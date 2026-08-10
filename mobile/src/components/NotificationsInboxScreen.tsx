import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenContent } from '@/src/components/ScreenContent';
import { useAdminNotifications } from '@/src/context/AdminNotificationsContext';
import { useAuth } from '@/src/context/AuthContext';
import { colors, radius, spacing } from '@/src/constants/theme';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type InboxNotification,
} from '@/src/lib/notificationsApi';

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

type NotificationsInboxScreenProps = {
  role: 'buyer' | 'seller';
};

export function NotificationsInboxScreen({ role }: NotificationsInboxScreenProps) {
  const { token } = useAuth();
  const { refreshUnreadCount, setUnreadCount } = useAdminNotifications();
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const data = await getNotifications(token, { page: 1, limit: 50 });
        setItems(data.notifications);
        await refreshUnreadCount();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, refreshUnreadCount],
  );

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  async function handleOpen(item: InboxNotification) {
    if (!token) return;

    if (!item.readAt) {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry,
        ),
      );
      setUnreadCount(Math.max(0, items.filter((entry) => !entry.readAt && entry.id !== item.id).length));

      try {
        await markNotificationRead(token, item.id);
        await refreshUnreadCount();
      } catch {
        await loadNotifications(true);
      }
    }
  }

  async function handleMarkAllRead() {
    if (!token || markingAll) return;
    const hasUnread = items.some((item) => !item.readAt);
    if (!hasUnread) return;

    setMarkingAll(true);
    try {
      await markAllNotificationsRead(token);
      setItems((current) =>
        current.map((item) => ({
          ...item,
          readAt: item.readAt || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
      await refreshUnreadCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  }

  const hasUnread = items.some((item) => !item.readAt);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenContent style={styles.screenContent}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.accent} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Notifications</Text>
          {hasUnread ? (
            <Pressable onPress={() => void handleMarkAllRead()} hitSlop={8} disabled={markingAll}>
              <Text style={styles.markAllText}>{markingAll ? '…' : 'Mark all'}</Text>
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void loadNotifications(true)}
                tintColor={colors.accent}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="notifications-outline" size={40} color={colors.muted} />
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptyBody}>
                  Announcements from Surplus will show up here{role === 'seller' ? ' for sellers' : ''}.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const unread = !item.readAt;
              return (
                <Pressable
                  style={[styles.card, unread && styles.cardUnread]}
                  onPress={() => void handleOpen(item)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.titleRow}>
                      {unread ? <View style={styles.unreadDot} /> : null}
                      <Text style={[styles.cardTitle, unread && styles.cardTitleUnread]} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </View>
                    <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.cardBody} numberOfLines={3}>
                    {item.body}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}
      </ScreenContent>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 72,
  },
  backText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  markAllText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 72,
    textAlign: 'right',
  },
  headerSpacer: {
    minWidth: 72,
  },
  errorBanner: {
    backgroundColor: '#FDEDEC',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: spacing.xl,
    flexGrow: 1,
    gap: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    paddingTop: spacing.xl * 2,
  },
  emptyTitle: {
    color: colors.textStrong,
    fontSize: 17,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardUnread: {
    borderColor: colors.borderAccent,
    backgroundColor: colors.bgSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 6,
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  cardTitleUnread: {
    color: colors.textStrong,
    fontWeight: '800',
  },
  timeText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  cardBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 16,
  },
});
