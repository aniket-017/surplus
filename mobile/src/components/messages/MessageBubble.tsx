import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ImageView from 'react-native-image-viewing';
import { Ionicons } from '@expo/vector-icons';

import { chatTheme } from '@/src/constants/chatTheme';
import { colors } from '@/src/constants/theme';
import type { ChatMessage } from '@/src/lib/conversationsApi';
import { formatMessageTime } from '@/src/lib/messageFormat';
import { getImageUrl } from '@/src/lib/productsApi';

type MessageBubbleProps = {
  message: ChatMessage;
  isMine: boolean;
  isGrouped?: boolean;
};

export function MessageBubble({ message, isMine, isGrouped }: MessageBubbleProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
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
    <>
      <View
        style={[
          styles.wrap,
          isMine ? styles.wrapMine : styles.wrapOther,
          isGrouped && styles.wrapGrouped,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleOther,
            hasImage && styles.bubbleWithImage,
          ]}
        >
          {hasImage ? (
            <Pressable onPress={() => setViewerOpen(true)}>
              <Image source={{ uri: imageUri! }} style={styles.image} contentFit="cover" />
            </Pressable>
          ) : null}

          {hasFile ? (
            <Pressable style={styles.fileRow} onPress={() => void openDocument()}>
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
            {isMine ? (
              <Ionicons name="checkmark-done" size={14} color={chatTheme.checkmark} style={styles.check} />
            ) : null}
          </View>
        </View>
      </View>

      {hasImage ? (
        <ImageView
          images={[{ uri: imageUri! }]}
          imageIndex={0}
          visible={viewerOpen}
          onRequestClose={() => setViewerOpen(false)}
        />
      ) : null}
    </>
  );
}

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
