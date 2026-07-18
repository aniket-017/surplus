import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatHeader } from '@/src/components/messages/ChatHeader';
import { ChatImageViewer } from '@/src/components/messages/ChatImageViewer';
import { ChatWallpaper } from '@/src/components/messages/ChatWallpaper';
import { DateSeparator } from '@/src/components/messages/DateSeparator';
import { MessageBubble } from '@/src/components/messages/MessageBubble';
import { MessageComposer } from '@/src/components/messages/MessageComposer';
import { MessageInfoModal } from '@/src/components/messages/MessageInfoModal';
import { useAuth } from '@/src/context/AuthContext';
import { useUnreadMessages } from '@/src/context/UnreadMessagesContext';
import { chatTheme } from '@/src/constants/chatTheme';
import { colors, spacing } from '@/src/constants/theme';
import {
  appendThreadMessage,
  getCachedThread,
  mergeThreadMessages,
  removeMessage,
  replaceOptimisticMessage,
  setActiveThread,
  setCachedThread,
} from '@/src/lib/chatCache';
import {
  getConversationMessages,
  sendMessage,
  sendMessageWithAttachment,
  type ChatMessage,
} from '@/src/lib/conversationsApi';
import { buildMessageListItems, type MessageListItem } from '@/src/lib/messageFormat';
import type { ChatAttachment } from '@/src/lib/chatAttachments';
import { getImageUrl } from '@/src/lib/productsApi';

type ThreadProduct = { id: string; title: string; images: string[] } | null;
type ThreadOtherParty = { id: string; name: string; avatarUrl: string | null } | null;

const PAGE_SIZE = 30;
const POLL_INTERVAL_MS = 10000;

export function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token, user } = useAuth();
  const { markConversationRead } = useUnreadMessages();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<MessageListItem>>(null);
  const pendingInitialScrollRef = useRef(true);
  const loadingOlderRef = useRef(false);

  const cached = id ? getCachedThread(id) : null;
  const messagesRef = useRef<ChatMessage[]>(cached?.messages ?? []);

  const [messages, setMessages] = useState<ChatMessage[]>(cached?.messages ?? []);
  const [product, setProduct] = useState<ThreadProduct>(cached?.conversation.product ?? null);
  const [otherParty, setOtherParty] = useState<ThreadOtherParty>(
    cached?.conversation.otherParty ?? null,
  );
  const [loading, setLoading] = useState(!cached);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(cached?.hasMoreOlder ?? false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [error, setError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [infoMessage, setInfoMessage] = useState<ChatMessage | null>(null);
  const keyboardVisible = keyboardHeight > 0;

  const topInset =
    Platform.OS === 'android'
      ? Math.max(insets.top, StatusBar.currentHeight ?? 0)
      : insets.top;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const listItems = useMemo(
    () => buildMessageListItems(messages, user?.id),
    [messages, user?.id],
  );
  const viewerImages = useMemo(
    () =>
      messages
        .filter((message) => Boolean(message.imageUrl))
        .map((message) => ({
          id: message.id,
          uri: getImageUrl(message.imageUrl!),
        })),
    [messages],
  );

  const openImageViewer = useCallback(
    (messageId: string) => {
      const index = viewerImages.findIndex((image) => image.id === messageId);
      if (index < 0) return;

      setViewerInitialIndex(index);
      setViewerVisible(true);
    },
    [viewerImages],
  );

  const scrollToEnd = useCallback((animated = true) => {
    const list = listRef.current;
    if (!list) return;

    requestAnimationFrame(() => list.scrollToEnd({ animated }));
    setTimeout(() => list.scrollToEnd({ animated }), 50);
    setTimeout(() => list.scrollToEnd({ animated }), 200);
  }, []);

  const scrollToEndIfPending = useCallback(
    (animated = false) => {
      if (!pendingInitialScrollRef.current) return;
      scrollToEnd(animated);
    },
    [scrollToEnd],
  );

  const finishInitialScroll = useCallback(() => {
    pendingInitialScrollRef.current = false;
  }, []);

  useEffect(() => {
    pendingInitialScrollRef.current = true;
    const nextCached = id ? getCachedThread(id) : null;
    if (nextCached) {
      messagesRef.current = nextCached.messages;
      setMessages(nextCached.messages);
      setProduct(nextCached.conversation.product);
      setOtherParty(nextCached.conversation.otherParty);
      setHasMoreOlder(nextCached.hasMoreOlder);
      setLoading(false);
    } else {
      messagesRef.current = [];
      setMessages([]);
      setProduct(null);
      setOtherParty(null);
      setHasMoreOlder(false);
      setLoading(true);
    }
    setError('');
    setDraft('');
    setPendingAttachment(null);
    setViewerVisible(false);
  }, [id]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const extra = Platform.OS === 'android' ? insets.bottom : 0;
      setKeyboardHeight(event.endCoordinates.height + extra);
      scrollToEnd(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToEnd, insets.bottom]);

  const applyThreadData = useCallback(
    (
      data: Awaited<ReturnType<typeof getConversationMessages>>,
      mode: 'replace' | 'merge' | 'prepend',
    ) => {
      if (!id) return;

      if (mode === 'replace') {
        setCachedThread(id, {
          messages: data.messages,
          conversation: data.conversation,
          hasMoreOlder: Boolean(data.hasMoreOlder),
        });
        setMessages(data.messages);
        setHasMoreOlder(Boolean(data.hasMoreOlder));
      } else if (mode === 'prepend') {
        const merged = mergeThreadMessages(id, data.messages, {
          prepend: true,
          hasMoreOlder: Boolean(data.hasMoreOlder),
          conversation: data.conversation,
        });
        if (merged) {
          setMessages(merged.messages);
          setHasMoreOlder(merged.hasMoreOlder);
        }
      } else {
        const merged = mergeThreadMessages(id, data.messages, {
          conversation: data.conversation,
        });
        if (merged) {
          setMessages(merged.messages);
        } else {
          setCachedThread(id, {
            messages: data.messages,
            conversation: data.conversation,
            hasMoreOlder: Boolean(data.hasMoreOlder),
          });
          setMessages(data.messages);
          setHasMoreOlder(Boolean(data.hasMoreOlder));
        }
      }

      setProduct(data.conversation.product);
      setOtherParty(data.conversation.otherParty);
      setError('');
    },
    [id],
  );

  const loadMessages = useCallback(
    async (mode: 'full' | 'delta' = 'full') => {
      if (!token || !id) {
        setLoading(false);
        return;
      }

      try {
        if (mode === 'delta') {
          const last = [...messagesRef.current]
            .reverse()
            .find((message) => !message.id.startsWith('temp-'));
          if (!last) {
            const data = await getConversationMessages(token, id, { limit: PAGE_SIZE });
            applyThreadData(data, 'replace');
          } else {
            const data = await getConversationMessages(token, id, {
              after: last.id,
              limit: PAGE_SIZE,
            });
            if (data.messages.length > 0) {
              applyThreadData(data, 'merge');
            }
          }
        } else {
          const data = await getConversationMessages(token, id, { limit: PAGE_SIZE });
          applyThreadData(data, 'replace');
        }

        void markConversationRead(id);
      } catch (err) {
        if (messagesRef.current.length === 0) {
          setError(err instanceof Error ? err.message : 'Failed to load messages');
        }
      } finally {
        setLoading(false);
      }
    },
    [token, id, markConversationRead, applyThreadData],
  );

  const loadOlderMessages = useCallback(async () => {
    if (!token || !id || !hasMoreOlder || loadingOlderRef.current) return;
    const oldest = messagesRef.current.find((message) => !message.id.startsWith('temp-'));
    if (!oldest) return;

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const data = await getConversationMessages(token, id, {
        before: oldest.id,
        limit: PAGE_SIZE,
      });
      applyThreadData(data, 'prepend');
    } catch {
      // Keep current messages if older page fails.
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [token, id, hasMoreOlder, applyThreadData]);

  useFocusEffect(
    useCallback(() => {
      pendingInitialScrollRef.current = true;
      void loadMessages('full');
      const interval = setInterval(() => {
        void loadMessages('delta');
      }, POLL_INTERVAL_MS);
      const focusScroll = setTimeout(() => scrollToEnd(false), 100);

      setActiveThread(id ?? null, () => {
        void loadMessages('delta');
      });

      return () => {
        clearInterval(interval);
        clearTimeout(focusScroll);
        setActiveThread(null, null);
      };
    }, [loadMessages, scrollToEnd, id]),
  );

  useEffect(() => {
    if (loading || listItems.length === 0) return;

    scrollToEnd(false);
    const doneTimer = setTimeout(finishInitialScroll, 600);

    return () => clearTimeout(doneTimer);
  }, [loading, listItems.length, id, scrollToEnd, finishInitialScroll]);

  useEffect(() => {
    if (!infoMessage) return;
    const fresh = messages.find((message) => message.id === infoMessage.id);
    if (
      fresh &&
      (fresh.status !== infoMessage.status ||
        fresh.deliveredAt !== infoMessage.deliveredAt ||
        fresh.readAt !== infoMessage.readAt)
    ) {
      setInfoMessage(fresh);
    }
  }, [messages, infoMessage]);

  async function handleSend() {
    if (!token || !id) return;

    if (pendingAttachment) {
      setUploading(true);
      try {
        const result = await sendMessageWithAttachment(
          token,
          id,
          pendingAttachment,
          draft.trim() || undefined,
        );
        setMessages((prev) => {
          const next = [...prev, result.message];
          appendThreadMessage(id, result.message);
          return next;
        });
        setDraft('');
        setPendingAttachment(null);
        setError('');
        scrollToEnd(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send attachment';
        setError(message);
        Alert.alert('Upload failed', message);
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!draft.trim()) return;

    const body = draft.trim();
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      conversationId: id,
      senderId: user?.id || '',
      body,
      imageUrl: null,
      fileUrl: null,
      fileName: null,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    setDraft('');
    setSending(true);
    setMessages((prev) => {
      const next = [...prev, optimistic];
      appendThreadMessage(id, optimistic);
      return next;
    });
    scrollToEnd(true);

    try {
      const result = await sendMessage(token, id, body);
      setMessages((prev) => {
        const next = prev.map((message) =>
          message.id === tempId ? result.message : message,
        );
        replaceOptimisticMessage(id, tempId, result.message);
        return next;
      });
    } catch (err) {
      setMessages((prev) => {
        const next = prev.filter((message) => message.id !== tempId);
        removeMessage(id, tempId);
        return next;
      });
      setDraft(body);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  function handleProductPress() {
    if (!product?.id) return;

    if (user?.role === 'seller') {
      router.push(`/(seller)/products/${product.id}` as never);
    } else {
      router.push({ pathname: '/products/[id]', params: { id: product.id } });
    }
  }

  const renderItem = useCallback(
    ({ item }: { item: MessageListItem }) => {
      if (item.type === 'date') {
        return <DateSeparator label={item.label} />;
      }

      return (
        <MessageBubble
          message={item.message}
          isMine={item.isMine}
          isGrouped={item.isGrouped}
          onImagePress={openImageViewer}
          onLongPress={setInfoMessage}
        />
      );
    },
    [openImageViewer],
  );

  if (loading && messages.length === 0) {
    return (
      <View style={[styles.safeArea, { paddingTop: topInset }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { paddingTop: topInset }]}>
      <ChatHeader
        role={user?.role ?? undefined}
        otherParty={otherParty}
        product={product}
        onBack={() => router.back()}
        onProductPress={product?.id ? handleProductPress : undefined}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.flex}>
        <ChatWallpaper>
          <FlatList
            ref={listRef}
            style={styles.messageListFlex}
            data={listItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messageList,
              { paddingBottom: spacing.sm },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onLayout={() => scrollToEndIfPending(false)}
            onContentSizeChange={() => scrollToEndIfPending(false)}
            onScroll={(event) => {
              if (event.nativeEvent.contentOffset.y < 80) {
                void loadOlderMessages();
              }
            }}
            scrollEventThrottle={200}
            ListHeaderComponent={
              loadingOlder ? (
                <View style={styles.olderLoader}>
                  <ActivityIndicator color={colors.accent} size="small" />
                </View>
              ) : null
            }
            windowSize={7}
            maxToRenderPerBatch={8}
            initialNumToRender={16}
            removeClippedSubviews={Platform.OS === 'android'}
            renderItem={renderItem}
          />
        </ChatWallpaper>

        <View style={styles.composerHost}>
          <MessageComposer
            draft={draft}
            pendingAttachment={pendingAttachment}
            sending={sending}
            uploading={uploading}
            keyboardVisible={keyboardVisible}
            onChangeText={setDraft}
            onSend={handleSend}
            onSelectAttachment={setPendingAttachment}
            onClearAttachment={() => setPendingAttachment(null)}
            onFocus={() => scrollToEnd(true)}
          />
        </View>

        <View style={{ height: keyboardHeight }} />
      </View>

      <ChatImageViewer
        images={viewerImages}
        initialIndex={viewerInitialIndex}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
      />

      <MessageInfoModal
        message={infoMessage}
        visible={Boolean(infoMessage)}
        onClose={() => setInfoMessage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: chatTheme.headerBg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: chatTheme.wallpaper,
  },
  errorBanner: {
    backgroundColor: 'rgba(192, 57, 43, 0.1)',
    padding: spacing.sm,
    marginHorizontal: spacing.lg,
    borderRadius: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  messageListFlex: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    flexGrow: 1,
  },
  olderLoader: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  composerHost: {
    backgroundColor: chatTheme.headerBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
});
