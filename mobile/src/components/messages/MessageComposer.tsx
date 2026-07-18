import * as DocumentPicker from 'expo-document-picker';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { CameraCaptureModal } from '@/src/components/messages/CameraCaptureModal';
import { EmojiPickerPanel } from '@/src/components/messages/EmojiPickerPanel';
import { chatTheme } from '@/src/constants/chatTheme';
import { colors, spacing } from '@/src/constants/theme';
import { buildAttachmentFromUri, type ChatAttachment } from '@/src/lib/chatAttachments';
import { pickImagesFromLibrary } from '@/src/lib/pickImages';

type MessageComposerProps = {
  draft: string;
  pendingAttachment: ChatAttachment | null;
  sending: boolean;
  uploading?: boolean;
  keyboardVisible?: boolean;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onSelectAttachment: (attachment: ChatAttachment) => void;
  onClearAttachment: () => void;
  onFocus?: () => void;
};

function isImageAttachment(attachment: ChatAttachment) {
  return attachment.type.startsWith('image/');
}

export function MessageComposer({
  draft,
  pendingAttachment,
  sending,
  uploading = false,
  keyboardVisible = false,
  onChangeText,
  onSend,
  onSelectAttachment,
  onClearAttachment,
  onFocus,
}: MessageComposerProps) {
  const inputRef = useRef<TextInputType>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const hasText = draft.trim().length > 0;
  const hasAttachment = pendingAttachment !== null;
  const canSend = hasText || hasAttachment;
  const isMultiline = draft.includes('\n');
  const busy = sending || uploading;

  function handleEmojiSelect(emoji: string) {
    onChangeText(draft + emoji);
    inputRef.current?.focus();
  }

  function handleFocus() {
    setEmojiOpen(false);
    onFocus?.();
  }

  async function pickFromLibrary() {
    const picked = await pickImagesFromLibrary({
      allowsMultipleSelection: false,
      quality: 0.85,
      permissionMessage: 'Allow photo library access to send images.',
    });
    if (!picked?.[0]) return;

    const asset = picked[0];
    onSelectAttachment(buildAttachmentFromUri(asset.uri, asset.name, asset.mimeType));
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/*',
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    onSelectAttachment(
      buildAttachmentFromUri(asset.uri, asset.name || `document-${Date.now()}`, asset.mimeType),
    );
  }

  function closeAttachMenu() {
    setAttachMenuOpen(false);
  }

  function handleAttachPress() {
    if (busy) return;
    setEmojiOpen(false);
    setAttachMenuOpen(true);
  }

  function handleCameraPress() {
    if (busy) return;
    setEmojiOpen(false);
    setCameraOpen(true);
  }

  function handlePickFromLibrary() {
    closeAttachMenu();
    // Let the attach modal finish dismissing before opening the system picker
    // (avoids Android PhotoPicker parse failures).
    setTimeout(() => {
      void pickFromLibrary();
    }, Platform.OS === 'android' ? 280 : 0);
  }

  function handlePickDocument() {
    closeAttachMenu();
    setTimeout(() => {
      void pickDocument().catch((error) => {
        console.warn('Document picker failed:', error);
        Alert.alert('Could not open files', 'Please try again.');
      });
    }, Platform.OS === 'android' ? 280 : 0);
  }

  return (
    <SafeAreaView edges={keyboardVisible ? [] : ['bottom']} style={styles.safeArea}>
      <View style={styles.host}>
        <EmojiPickerPanel visible={emojiOpen} onSelect={handleEmojiSelect} />

        {pendingAttachment ? (
          <View style={styles.attachmentPreview}>
            {isImageAttachment(pendingAttachment) ? (
              <Image source={{ uri: pendingAttachment.uri }} style={styles.attachmentThumb} />
            ) : (
              <View style={styles.attachmentDocIcon}>
                <Ionicons name="document-text-outline" size={22} color={colors.accent} />
              </View>
            )}
            <Text style={styles.attachmentName} numberOfLines={1}>
              {pendingAttachment.name}
            </Text>
            <Pressable
              hitSlop={8}
              style={styles.attachmentRemove}
              onPress={onClearAttachment}
              disabled={busy}
              accessibilityLabel="Remove attachment"
            >
              <Ionicons name="close-circle" size={22} color={colors.muted} />
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.row, isMultiline && styles.rowMultiline]}>
          <View style={[styles.inputWrap, isMultiline && styles.inputWrapMultiline]}>
            <Pressable
              hitSlop={6}
              style={[styles.iconSlot, isMultiline && styles.iconSlotMultiline]}
              onPress={() => setEmojiOpen((open) => !open)}
              disabled={busy}
            >
              <Ionicons
                name={emojiOpen ? 'happy' : 'happy-outline'}
                size={22}
                color={emojiOpen ? colors.accent : colors.muted}
              />
            </Pressable>
            <TextInput
              ref={inputRef}
              style={[styles.input, isMultiline && styles.inputMultiline]}
              value={draft}
              onChangeText={onChangeText}
              placeholder="Message"
              placeholderTextColor={colors.muted}
              multiline
              editable={!busy}
              blurOnSubmit={false}
              submitBehavior="newline"
              textAlignVertical={isMultiline ? 'top' : 'center'}
              scrollEnabled={isMultiline}
              onFocus={handleFocus}
            />
            <Pressable
              hitSlop={6}
              style={[styles.iconSlot, isMultiline && styles.iconSlotMultiline]}
              onPress={handleCameraPress}
              disabled={busy}
              accessibilityLabel="Take photo"
            >
              <Ionicons name="camera-outline" size={22} color={colors.muted} />
            </Pressable>
            <Pressable
              hitSlop={6}
              style={[styles.iconSlot, isMultiline && styles.iconSlotMultiline]}
              onPress={handleAttachPress}
              disabled={busy}
              accessibilityLabel="Attach file"
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.muted} />
              ) : (
                <Ionicons name="attach" size={22} color={colors.muted} />
              )}
            </Pressable>
          </View>

          {canSend ? (
            <Pressable
              onPress={onSend}
              disabled={busy}
              style={[styles.actionButton, isMultiline && styles.actionButtonMultiline]}
            >
              {busy ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="send" size={18} color={colors.white} style={styles.sendIcon} />
              )}
            </Pressable>
          ) : null}
        </View>
      </View>

      <Modal
        visible={attachMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={closeAttachMenu}
      >
        <Pressable style={styles.attachBackdrop} onPress={closeAttachMenu}>
          <Pressable style={styles.attachSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.attachTitle}>Attach file</Text>
            <Text style={styles.attachSubtitle}>Choose what to send</Text>

            <Pressable style={styles.attachOption} onPress={handlePickFromLibrary}>
              <Ionicons name="images-outline" size={22} color={colors.accent} />
              <Text style={styles.attachOptionText}>Photo Library</Text>
            </Pressable>

            <Pressable style={styles.attachOption} onPress={handlePickDocument}>
              <Ionicons name="document-text-outline" size={22} color={colors.accent} />
              <Text style={styles.attachOptionText}>Document</Text>
            </Pressable>

            <Pressable style={styles.attachCancel} onPress={closeAttachMenu}>
              <Text style={styles.attachCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <CameraCaptureModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(attachment) => {
          setCameraOpen(false);
          onSelectAttachment(attachment);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: chatTheme.composerBg,
  },
  host: {
    position: 'relative',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  attachmentThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  attachmentDocIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  attachmentName: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 14,
  },
  attachmentRemove: {
    padding: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  rowMultiline: {
    alignItems: 'flex-end',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    maxHeight: 132,
    borderRadius: 24,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  inputWrapMultiline: {
    alignItems: 'flex-end',
    paddingVertical: 6,
  },
  iconSlot: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlotMultiline: {
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 120,
    color: colors.textStrong,
    fontSize: 16,
    lineHeight: 20,
    paddingHorizontal: 4,
    paddingVertical: Platform.OS === 'android' ? 0 : 4,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  inputMultiline: {
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: Platform.OS === 'android' ? 6 : 4,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonMultiline: {
    alignSelf: 'flex-end',
  },
  sendIcon: {
    marginLeft: 2,
  },
  attachBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  attachSheet: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  attachTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  attachSubtitle: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  attachOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  attachOptionText: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '500',
  },
  attachCancel: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  attachCancelText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '600',
  },
});
