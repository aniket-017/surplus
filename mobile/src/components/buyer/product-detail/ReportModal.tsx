import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/src/constants/theme';

export const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'MISLEADING', label: 'Misleading' },
  { value: 'PROHIBITED', label: 'Prohibited item' },
  { value: 'WRONG_CATEGORY', label: 'Wrong category' },
  { value: 'OTHER', label: 'Other' },
] as const;

export type ReportReasonValue = (typeof REPORT_REASONS)[number]['value'];

type ReportModalProps = {
  visible: boolean;
  submitting: boolean;
  reason: ReportReasonValue | null;
  details: string;
  onChangeReason: (reason: ReportReasonValue) => void;
  onChangeDetails: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ReportModal({
  visible,
  submitting,
  reason,
  details,
  onChangeReason,
  onChangeDetails,
  onClose,
  onSubmit,
}: ReportModalProps) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const sheetPaddingBottom =
    keyboardHeight > 0
      ? keyboardHeight + spacing.lg
      : Math.max(insets.bottom, spacing.lg);

  const canSubmit =
    Boolean(reason) && (reason !== 'OTHER' || details.trim().length > 0) && !submitting;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={undefined} style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: sheetPaddingBottom }]}>
          <Text style={styles.title}>Report listing</Text>
          <Text style={styles.subtitle}>
            Tell us what is wrong with this listing. Our team will review your report.
          </Text>

          <View style={styles.reasons}>
            {REPORT_REASONS.map((item) => {
              const selected = reason === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => onChangeReason(item.value)}
                  style={[styles.reasonChip, selected && styles.reasonChipSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={styles.input}
            value={details}
            onChangeText={onChangeDetails}
            placeholder={
              reason === 'OTHER'
                ? 'Describe the issue (required)...'
                : 'Add optional details...'
            }
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitText}>Submit report</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 27, 45, 0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: colors.textStrong,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  reasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
  },
  reasonChipSelected: {
    backgroundColor: 'rgba(92, 179, 53, 0.16)',
  },
  reasonText: {
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '700',
  },
  reasonTextSelected: {
    color: colors.accent,
  },
  input: {
    minHeight: 100,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    color: colors.textStrong,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
