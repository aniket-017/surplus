import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenContent } from '@/src/components/ScreenContent';
import { useAuth } from '@/src/context/AuthContext';
import { useUnreadMessages } from '@/src/context/UnreadMessagesContext';
import { CHAT_CONTENT_MAX_WIDTH } from '@/src/constants/layout';
import { colors, spacing } from '@/src/constants/theme';
import { getCachedConversations, setCachedConversations } from '@/src/lib/chatCache';
import { getConversations, type ConversationSummary } from '@/src/lib/conversationsApi';
import { formatConversationTime } from '@/src/lib/messageFormat';
import { getImageUrl } from '@/src/lib/productsApi';

function getPreview(conversation: ConversationSummary) {
  const body = conversation.lastMessage?.body?.trim();
  if (body) return body;
  return 'Inquiry sent';
}

function getRowTitle(conversation: ConversationSummary, role: 'buyer' | 'seller' | null | undefined) {
  const productTitle = conversation.product?.title || 'Listing';

  if (role === 'seller') {
    const buyerName = conversation.otherParty?.name || 'User';
    return `${buyerName} - ${productTitle}`;
  }

  return productTitle;
}

type ConversationListProps = {
  emptySubtitle: string;
};

type ConversationRowProps = {
  item: ConversationSummary;
  role: 'buyer' | 'seller' | null | undefined;
};

const ConversationRow = memo(function ConversationRow({ item, role }: ConversationRowProps) {
  const title = getRowTitle(item, role);
  const productImage = item.product?.images?.[0];
  const unread = (item.unreadCount || 0) > 0;

  return (
    <Pressable
      style={[styles.row, unread && styles.rowUnread]}
      onPress={() => {
        if (role === 'seller') {
          router.push(`/(seller)/messages/${item.id}` as never);
        } else {
          router.push({ pathname: '/messages/[id]', params: { id: item.id } });
        }
      }}
    >
      {productImage ? (
        <Image source={{ uri: getImageUrl(productImage) }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Ionicons name="cube-outline" size={22} color={colors.muted} />
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, unread && styles.nameUnread]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.time, unread && styles.timeUnread]}>
            {formatConversationTime(item.lastMessageAt)}
          </Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
            {getPreview(item)}
          </Text>
          {unread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

export function ConversationList({ emptySubtitle }: ConversationListProps) {
  const { token, user } = useAuth();
  const { refreshUnreadCount } = useUnreadMessages();
  const cached = getCachedConversations();
  const [conversations, setConversations] = useState<ConversationSummary[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await getConversations(token);
      setConversations(data.conversations);
      setCachedConversations(data.conversations);
      setError('');
      void refreshUnreadCount();
    } catch (err) {
      if (!getCachedConversations()?.length) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, refreshUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      const existing = getCachedConversations();
      if (existing) {
        setConversations(existing);
        setLoading(false);
      }
      void load();
    }, [load]),
  );

  function handleRefresh() {
    setRefreshing(true);
    void load();
  }

  const renderItem = useCallback(
    ({ item }: { item: ConversationSummary }) => (
      <ConversationRow item={item} role={user?.role} />
    ),
    [user?.role],
  );

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No chats yet</Text>
        <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
      </View>
    );
  }

  return (
    <ScreenContent maxWidth={CHAT_CONTENT_MAX_WIDTH} style={styles.listWrap}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
        windowSize={7}
        maxToRenderPerBatch={10}
        initialNumToRender={12}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={renderItem}
      />
    </ScreenContent>
  );
}

const styles = StyleSheet.create({
  listWrap: {
    flex: 1,
  },
  list: {
    paddingBottom: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    minHeight: 76,
  },
  rowUnread: {
    backgroundColor: 'rgba(22, 163, 74, 0.06)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  name: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  nameUnread: {
    fontWeight: '800',
  },
  time: {
    color: colors.muted,
    fontSize: 12,
  },
  timeUnread: {
    color: colors.accent,
    fontWeight: '700',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  preview: {
    flex: 1,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 19,
  },
  previewUnread: {
    color: colors.textStrong,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
});
