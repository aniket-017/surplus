import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { EmojiPickerPanel } from '@/src/components/messages/EmojiPickerPanel';
import { chatTheme } from '@/src/constants/chatTheme';
import { colors, spacing } from '@/src/constants/theme';
import { buildAttachmentFromUri, type ChatAttachment } from '@/src/lib/chatAttachments';

type MessageComposerProps = {
  draft: string;
  sending: boolean;
  uploading?: boolean;
  keyboardVisible?: boolean;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttachFile: (attachment: ChatAttachment) => void;
  onFocus?: () => void;
};

export function MessageComposer({
  draft,
  sending,
  uploading = false,
  keyboardVisible = false,
  onChangeText,
  onSend,
  onAttachFile,
  onFocus,
}: MessageComposerProps) {
  const inputRef = useRef<TextInputType>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const hasText = draft.trim().length > 0;
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
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo library access to send images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    onAttachFile(
      buildAttachmentFromUri(
        asset.uri,
        asset.fileName || `photo-${Date.now()}.jpg`,
        asset.mimeType,
      ),
    );
  }

  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    onAttachFile(
      buildAttachmentFromUri(
        asset.uri,
        asset.fileName || `photo-${Date.now()}.jpg`,
        asset.mimeType,
      ),
    );
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
    onAttachFile(
      buildAttachmentFromUri(asset.uri, asset.name || `document-${Date.now()}`, asset.mimeType),
    );
  }

  function handleAttachPress() {
    if (busy) return;

    Alert.alert('Attach file', 'Choose what to send', [
      { text: 'Photo Library', onPress: () => void pickFromLibrary() },
      { text: 'Take Photo', onPress: () => void pickFromCamera() },
      { text: 'Document', onPress: () => void pickDocument() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView edges={keyboardVisible ? [] : ['bottom']} style={styles.safeArea}>
      <View style={styles.host}>
        <EmojiPickerPanel visible={emojiOpen} onSelect={handleEmojiSelect} />

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
              onPress={handleAttachPress}
              disabled={busy}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.muted} />
              ) : (
                <Ionicons name="attach" size={22} color={colors.muted} />
              )}
            </Pressable>
          </View>

          {hasText ? (
            <Pressable
              onPress={onSend}
              disabled={busy}
              style={[styles.actionButton, isMultiline && styles.actionButtonMultiline]}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="send" size={18} color={colors.white} style={styles.sendIcon} />
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
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
});
