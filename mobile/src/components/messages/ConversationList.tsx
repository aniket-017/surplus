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

import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import { getConversations, type ConversationSummary } from '@/src/lib/conversationsApi';
import { getImageUrl } from '@/src/lib/productsApi';
import { formatRelativeDate } from '@/src/lib/productFormat';

function getPreview(conversation: ConversationSummary) {
  const body = conversation.lastMessage?.body?.trim();
  if (body) return body;
  return 'Inquiry sent';
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
        <Text style={styles.emptyTitle}>No messages yet</Text>
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
        const thumb = item.product?.images?.[0];
        const name = item.otherParty?.name || 'User';

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
            {thumb ? (
              <Image source={{ uri: getImageUrl(thumb) }} style={styles.thumb} contentFit="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbFallback]} />
            )}
            <View style={styles.content}>
              <View style={styles.topRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.product?.title || 'Listing'}
                </Text>
                <Text style={styles.time}>{formatRelativeDate(item.lastMessageAt)}</Text>
              </View>
              <Text style={styles.name}>{name}</Text>
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
    padding: spacing.lg,
    gap: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.sm,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  thumbFallback: {
    backgroundColor: colors.surfaceMuted,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  title: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  time: {
    color: colors.muted,
    fontSize: 11,
  },
  name: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  preview: {
    color: colors.text,
    fontSize: 13,
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
