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
import { ChatWallpaper } from '@/src/components/messages/ChatWallpaper';
import { DateSeparator } from '@/src/components/messages/DateSeparator';
import { MessageBubble } from '@/src/components/messages/MessageBubble';
import { MessageComposer } from '@/src/components/messages/MessageComposer';
import { useAuth } from '@/src/context/AuthContext';
import { chatTheme } from '@/src/constants/chatTheme';
import { colors, spacing } from '@/src/constants/theme';
import {
  getConversationMessages,
  sendMessage,
  sendMessageWithAttachment,
  type ChatMessage,
} from '@/src/lib/conversationsApi';
import { buildMessageListItems, type MessageListItem } from '@/src/lib/messageFormat';
import type { ChatAttachment } from '@/src/lib/chatAttachments';

type ThreadProduct = { id: string; title: string; images: string[] } | null;
type ThreadOtherParty = { id: string; name: string; avatarUrl: string | null } | null;

export function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<MessageListItem>>(null);
  const pendingInitialScrollRef = useRef(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [product, setProduct] = useState<ThreadProduct>(null);
  const [otherParty, setOtherParty] = useState<ThreadOtherParty>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardVisible = keyboardHeight > 0;

  // In Expo Go's edge-to-edge mode the safe-area top inset can report 0, letting
  // the header slide under the status bar. Fall back to the native status bar
  // height on Android so the header always clears the clock/battery icons.
  const topInset =
    Platform.OS === 'android'
      ? Math.max(insets.top, StatusBar.currentHeight ?? 0)
      : insets.top;

  const listItems = useMemo(
    () => buildMessageListItems(messages, user?.id),
    [messages, user?.id],
  );

  const scrollToEnd = useCallback((animated = true) => {
    const list = listRef.current;
    if (!list) return;

    // Multiple passes so we still land on the last message after layout/images settle.
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
    setMessages([]);
    setProduct(null);
    setOtherParty(null);
    setLoading(true);
    setError('');
  }, [id]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      // On Android (edge-to-edge) the reported keyboard height excludes the
      // navigation bar, so add the bottom inset so the composer clears it fully.
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

  const loadMessages = useCallback(async () => {
    if (!token || !id) {
      setLoading(false);
      return;
    }

    try {
      const data = await getConversationMessages(token, id);
      setMessages(data.messages);
      setProduct(data.conversation.product);
      setOtherParty(data.conversation.otherParty);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useFocusEffect(
    useCallback(() => {
      pendingInitialScrollRef.current = true;
      loadMessages();
      const interval = setInterval(loadMessages, 10000);
      const focusScroll = setTimeout(() => scrollToEnd(false), 100);

      return () => {
        clearInterval(interval);
        clearTimeout(focusScroll);
      };
    }, [loadMessages, scrollToEnd]),
  );

  useEffect(() => {
    if (loading || listItems.length === 0) return;

    scrollToEnd(false);
    const doneTimer = setTimeout(finishInitialScroll, 600);

    return () => clearTimeout(doneTimer);
  }, [loading, listItems.length, id, scrollToEnd, finishInitialScroll]);

  async function handleSend() {
    if (!token || !id || !draft.trim()) return;

    setSending(true);
    try {
      const result = await sendMessage(token, id, draft.trim());
      setMessages((prev) => [...prev, result.message]);
      setDraft('');
      scrollToEnd(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  async function handleAttachFile(attachment: ChatAttachment) {
    if (!token || !id) return;

    setUploading(true);
    try {
      const result = await sendMessageWithAttachment(token, id, attachment, draft.trim() || undefined);
      setMessages((prev) => [...prev, result.message]);
      setDraft('');
      setError('');
      scrollToEnd(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send attachment';
      setError(message);
      Alert.alert('Upload failed', message);
    } finally {
      setUploading(false);
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
            renderItem={({ item }) => {
              if (item.type === 'date') {
                return <DateSeparator label={item.label} />;
              }

              return (
                <MessageBubble
                  message={item.message}
                  isMine={item.isMine}
                  isGrouped={item.isGrouped}
                />
              );
            }}
          />
        </ChatWallpaper>

        {/*
          Composer lives in normal flex flow. A spacer below it grows to the
          keyboard height when the keyboard is open (lifting the composer above
          it) and collapses to exactly 0 when closed — so no residual gap remains
          after the keyboard is dismissed.
        */}
        <View style={styles.composerHost}>
          <MessageComposer
            draft={draft}
            sending={sending}
            uploading={uploading}
            keyboardVisible={keyboardVisible}
            onChangeText={setDraft}
            onSend={handleSend}
            onAttachFile={handleAttachFile}
            onFocus={() => scrollToEnd(true)}
          />
        </View>

        <View style={{ height: keyboardHeight }} />
      </View>
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
  composerHost: {
    backgroundColor: chatTheme.headerBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
});