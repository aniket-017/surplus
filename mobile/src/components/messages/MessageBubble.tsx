import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { chatTheme } from '@/src/constants/chatTheme';
import { colors } from '@/src/constants/theme';
import type { ChatMessage, MessageReceiptStatus } from '@/src/lib/conversationsApi';
import { formatMessageTime } from '@/src/lib/messageFormat';
import { getImageUrl } from '@/src/lib/productsApi';

type MessageBubbleProps = {
  message: ChatMessage;
  isMine: boolean;
  isGrouped?: boolean;
  onImagePress?: (messageId: string) => void;
  onLongPress?: (message: ChatMessage) => void;
};

function ReceiptCheck({ status }: { status?: MessageReceiptStatus | null }) {
  const resolved = status ?? 'sent';
  const isRead = resolved === 'read';
  const isDouble = resolved === 'delivered' || resolved === 'read';

  return (
    <Ionicons
      name={isDouble ? 'checkmark-done' : 'checkmark'}
      size={14}
      color={isRead ? chatTheme.checkmarkRead : chatTheme.checkmark}
      style={styles.check}
    />
  );
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isMine,
  isGrouped,
  onImagePress,
  onLongPress,
}: MessageBubbleProps) {
  const body = message.body?.trim();
  const imageUri = message.imageUrl ? getImageUrl(message.imageUrl) : null;
  const fileUri = message.fileUrl ? getImageUrl(message.fileUrl) : null;
  const hasImage = Boolean(imageUri);
  const hasFile = Boolean(fileUri && message.fileName);
  const hasContent = Boolean(body || hasImage || hasFile);

  async function openDocument() {
    if (!fileUri) return;
    await WebBrowser.openBrowserAsync(fileUri);
  }

  return (
    <View
      style={[
        styles.wrap,
        isMine ? styles.wrapMine : styles.wrapOther,
        isGrouped && styles.wrapGrouped,
      ]}
    >
      <Pressable
        onLongPress={isMine && onLongPress ? () => onLongPress(message) : undefined}
        delayLongPress={350}
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleOther,
          hasImage && styles.bubbleWithImage,
        ]}
      >
        {hasImage ? (
          <Pressable
            onPress={() => onImagePress?.(message.id)}
            onLongPress={isMine && onLongPress ? () => onLongPress(message) : undefined}
            delayLongPress={350}
            accessibilityRole="imagebutton"
            accessibilityLabel="Open image"
          >
            <Image source={{ uri: imageUri! }} style={styles.image} contentFit="cover" />
          </Pressable>
        ) : null}

        {hasFile ? (
          <Pressable
            style={styles.fileRow}
            onPress={() => void openDocument()}
            onLongPress={isMine && onLongPress ? () => onLongPress(message) : undefined}
            delayLongPress={350}
          >
            <View style={styles.fileIconWrap}>
              <Ionicons name="document-text-outline" size={22} color={colors.accent} />
            </View>
            <Text style={styles.fileName} numberOfLines={2}>
              {message.fileName}
            </Text>
          </Pressable>
        ) : null}

        {body ? <Text style={[styles.body, (hasImage || hasFile) && styles.caption]}>{body}</Text> : null}

        {!hasContent ? <Text style={styles.body}>Inquiry sent</Text> : null}

        <View style={styles.meta}>
          <Text style={styles.time}>{formatMessageTime(message.createdAt)}</Text>
          {isMine ? <ReceiptCheck status={message.status} /> : null}
        </View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  wrapGrouped: {
    marginBottom: 3,
  },
  wrapMine: {
    justifyContent: 'flex-end',
  },
  wrapOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '72%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleWithImage: {
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  bubbleMine: {
    backgroundColor: chatTheme.bubbleSent,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: chatTheme.bubbleReceived,
    borderBottomLeftRadius: 4,
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 180,
    maxWidth: 240,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  fileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  body: {
    color: colors.textStrong,
    fontSize: 15,
    lineHeight: 21,
  },
  caption: {
    marginTop: 6,
    paddingHorizontal: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
    gap: 3,
    paddingHorizontal: 4,
  },
  time: {
    color: chatTheme.timestamp,
    fontSize: 11,
    lineHeight: 14,
  },
  check: {
    marginTop: 1,
  },
});
