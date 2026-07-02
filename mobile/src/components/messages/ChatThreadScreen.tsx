import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  type KeyboardEvent,
  Platform,
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

const COMPOSER_HEIGHT = 68;
const ANDROID_KEYBOARD_BUFFER = 20;

function resolveKeyboardOffset(event: KeyboardEvent) {
  const windowHeight = Dimensions.get('window').height;
  const fromScreenY = Math.max(0, windowHeight - event.endCoordinates.screenY);
  const measured = Math.max(event.endCoordinates.height, fromScreenY);

  if (Platform.OS === 'android') {
    return measured + ANDROID_KEYBOARD_BUFFER;
  }

  return measured;
}

function readKeyboardOffset() {
  const metrics = Keyboard.metrics();
  if (!metrics) return 0;

  const windowHeight = Dimensions.get('window').height;
  const fromScreenY = Math.max(0, windowHeight - metrics.screenY);
  const measured = Math.max(metrics.height, fromScreenY);

  if (Platform.OS === 'android') {
    return measured + ANDROID_KEYBOARD_BUFFER;
  }

  return measured;
}

export function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<MessageListItem>>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [product, setProduct] = useState<ThreadProduct>(null);
  const [otherParty, setOtherParty] = useState<ThreadOtherParty>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [composerHeight, setComposerHeight] = useState(COMPOSER_HEIGHT);

  const listItems = useMemo(
    () => buildMessageListItems(messages, user?.id),
    [messages, user?.id],
  );

  const listBottomPadding =
    composerHeight +
    spacing.sm +
    (keyboardHeight > 0 ? keyboardHeight : Math.max(insets.bottom, spacing.xs));

  const applyKeyboardOffset = useCallback((event?: KeyboardEvent) => {
    const nextHeight = event ? resolveKeyboardOffset(event) : readKeyboardOffset();
    if (nextHeight > 0) {
      setKeyboardHeight(nextHeight);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      applyKeyboardOffset(event);
      if (Platform.OS === 'android') {
        setTimeout(() => applyKeyboardOffset(), 100);
        setTimeout(() => applyKeyboardOffset(), 250);
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [applyKeyboardOffset]);

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
      setLoading(true);
      loadMessages();
      const interval = setInterval(loadMessages, 10000);
      return () => clearInterval(interval);
    }, [loadMessages]),
  );

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  async function handleSend() {
    if (!token || !id || !draft.trim()) return;

    setSending(true);
    try {
      const result = await sendMessage(token, id, draft.trim());
      setMessages((prev) => [...prev, result.message]);
      setDraft('');
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
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
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
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
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
            contentContainerStyle={[styles.messageList, { paddingBottom: listBottomPadding }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
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

        <View
          style={[styles.composerHost, { bottom: keyboardHeight }]}
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            if (nextHeight > 0 && Math.abs(nextHeight - composerHeight) > 1) {
              setComposerHeight(nextHeight);
            }
          }}
        >
          <MessageComposer
            draft={draft}
            sending={sending}
            uploading={uploading}
            keyboardVisible={keyboardHeight > 0}
            onChangeText={setDraft}
            onSend={handleSend}
            onAttachFile={handleAttachFile}
            onFocus={() => {
              setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
            }}
          />
        </View>
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
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
