import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CameraCaptureModal } from '@/src/components/messages/CameraCaptureModal';
import { colors, spacing } from '@/src/constants/theme';
import { pickImagesFromLibrary } from '@/src/lib/pickImages';
import type { LocalImage } from '@/src/types/product';

type ProductImageSourceSheetProps = {
  visible: boolean;
  remainingSlots: number;
  onClose: () => void;
  onImagesSelected: (images: LocalImage[]) => void;
};

export function ProductImageSourceSheet({
  visible,
  remainingSlots,
  onClose,
  onImagesSelected,
}: ProductImageSourceSheetProps) {
  const [cameraOpen, setCameraOpen] = useState(false);

  function handleClose() {
    setCameraOpen(false);
    onClose();
  }

  async function pickFromLibrary() {
    if (remainingSlots <= 0) return;

    onClose();

    // Wait for the sheet to dismiss before launching the system picker.
    await new Promise((resolve) => setTimeout(resolve, Platform.OS === 'android' ? 280 : 0));

    const picked = await pickImagesFromLibrary({
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.7,
      permissionMessage: 'Allow photo library access to upload product images.',
    });
    if (!picked?.length) return;

    onImagesSelected(
      picked.slice(0, remainingSlots).map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'image/jpeg',
      })),
    );
  }

  function openCamera() {
    if (remainingSlots <= 0) return;
    onClose();
    // Let the sheet modal dismiss before presenting the camera (avoids Android modal races).
    setTimeout(() => setCameraOpen(true), 180);
  }

  return (
    <>
      <Modal
        visible={visible && !cameraOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.title}>Add photos</Text>
            <Text style={styles.subtitle}>
              Capture with your camera or choose from your library
              {remainingSlots < 5 ? ` · ${remainingSlots} left` : ''}
            </Text>

            <View style={styles.optionsRow}>
              <Pressable
                style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                onPress={openCamera}
                accessibilityRole="button"
                accessibilityLabel="Take photo"
              >
                <View style={[styles.optionIcon, styles.optionIconCamera]}>
                  <Ionicons name="camera" size={26} color={colors.accent} />
                </View>
                <Text style={styles.optionLabel}>Take photo</Text>
                <Text style={styles.optionHint}>Use camera</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                onPress={() => void pickFromLibrary()}
                accessibilityRole="button"
                accessibilityLabel="Choose from gallery"
              >
                <View style={[styles.optionIcon, styles.optionIconGallery]}>
                  <Ionicons name="images" size={26} color={colors.accent} />
                </View>
                <Text style={styles.optionLabel}>Gallery</Text>
                <Text style={styles.optionHint}>Pick photos</Text>
              </Pressable>
            </View>

            <Pressable style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <CameraCaptureModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        permissionMessage="Allow camera access to photograph products for your listing."
        onCapture={(attachment) => {
          setCameraOpen(false);
          onImagesSelected([
            {
              uri: attachment.uri,
              name: attachment.name || `product-${Date.now()}.jpg`,
              type: attachment.type || 'image/jpeg',
            },
          ]);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15, 27, 45, 0.12)',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textStrong,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: spacing.lg,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSubtle,
  },
  optionCardPressed: {
    borderColor: colors.borderAccent,
    backgroundColor: 'rgba(92, 179, 53, 0.08)',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  optionIconCamera: {
    backgroundColor: 'rgba(92, 179, 53, 0.14)',
  },
  optionIconGallery: {
    backgroundColor: 'rgba(92, 179, 53, 0.14)',
  },
  optionLabel: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  optionHint: {
    color: colors.muted,
    fontSize: 12,
  },
  cancelBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  cancelText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '700',
  },
});
