import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { chatTheme } from '@/src/constants/chatTheme';
import { colors, spacing } from '@/src/constants/theme';
import type { ChatMessage } from '@/src/lib/conversationsApi';
import { formatMessageInfoTime } from '@/src/lib/messageFormat';

type MessageInfoModalProps = {
  message: ChatMessage | null;
  visible: boolean;
  onClose: () => void;
};

function ReceiptRow({
  label,
  icon,
  iconColor,
  time,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  time: string | null | undefined;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={[styles.rowTime, !time && styles.rowWaiting]}>
        {time ? formatMessageInfoTime(time) : 'Waiting'}
      </Text>
    </View>
  );
}

export function MessageInfoModal({ message, visible, onClose }: MessageInfoModalProps) {
  if (!message) return null;

  const preview =
    message.body?.trim() ||
    (message.imageUrl ? 'Photo' : null) ||
    (message.fileName ? message.fileName : null) ||
    'Message';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Message info</Text>

          <View style={styles.previewBubble}>
            <Text style={styles.previewText} numberOfLines={3}>
              {preview}
            </Text>
            <Text style={styles.previewTime}>{formatMessageInfoTime(message.createdAt)}</Text>
          </View>

          <View style={styles.receiptCard}>
            <ReceiptRow
              label="Delivered"
              icon="checkmark-done"
              iconColor={chatTheme.checkmark}
              time={message.deliveredAt}
            />
            <View style={styles.divider} />
            <ReceiptRow
              label="Read"
              icon="checkmark-done"
              iconColor={message.readAt ? chatTheme.checkmarkRead : chatTheme.checkmark}
              time={message.readAt}
            />
          </View>

          <Pressable style={styles.closeBtn} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textStrong,
    marginBottom: spacing.md,
  },
  previewBubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: chatTheme.bubbleSent,
    borderRadius: 12,
    borderBottomRightRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: spacing.lg,
  },
  previewText: {
    color: colors.textStrong,
    fontSize: 15,
    lineHeight: 21,
  },
  previewTime: {
    marginTop: 4,
    alignSelf: 'flex-end',
    color: chatTheme.timestamp,
    fontSize: 11,
  },
  receiptCard: {
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.textStrong,
    fontWeight: '500',
  },
  rowTime: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: 13,
    color: colors.muted,
  },
  rowWaiting: {
    fontStyle: 'italic',
    color: 'rgba(0,0,0,0.4)',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: chatTheme.rowDivider,
  },
  closeBtn: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
});
