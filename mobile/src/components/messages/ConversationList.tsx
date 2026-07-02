import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
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

export function ConversationList({ emptySubtitle }: ConversationListProps) {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
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
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function handleRefresh() {
    setRefreshing(true);
    load();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (error) {
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
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
      }
      renderItem={({ item }) => {
        const title = getRowTitle(item, user?.role);
        const productImage = item.product?.images?.[0];

        return (
          <Pressable
            style={styles.row}
            onPress={() => {
              if (user?.role === 'seller') {
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
                <Text style={styles.name} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={styles.time}>{formatConversationTime(item.lastMessageAt)}</Text>
              </View>
              <Text style={styles.preview} numberOfLines={1}>
                {getPreview(item)}
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
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
  time: {
    color: colors.muted,
    fontSize: 12,
  },
  preview: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 19,
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
