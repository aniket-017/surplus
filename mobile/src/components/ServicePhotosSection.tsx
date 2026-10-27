import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CameraCaptureModal } from '@/src/components/messages/CameraCaptureModal';
import { ProductImageSourceSheet } from '@/src/components/ProductImageSourceSheet';
import { colors, spacing } from '@/src/constants/theme';
import { pickImagesFromLibrary } from '@/src/lib/pickImages';
import { getImageUrl } from '@/src/lib/productsApi';
import type { LocalImage } from '@/src/types/product';

export const MAX_SERVICE_IMAGES = 5;

type ServicePhotosSectionProps = {
  newImages: LocalImage[];
  onChangeNewImages: (images: LocalImage[]) => void;
  /** Photos already saved on the service. When present, new photos replace them on save. */
  existingImages?: string[];
  replacing?: boolean;
  onStartReplace?: () => void;
  onKeepExisting?: () => void;
  /** Slim "Add photos (optional)" row with direct camera and gallery actions. */
  compact?: boolean;
};

export function ServicePhotosSection({
  newImages,
  onChangeNewImages,
  existingImages = [],
  replacing = true,
  onStartReplace,
  onKeepExisting,
  compact = false,
}: ServicePhotosSectionProps) {
  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const showingExisting = !replacing && existingImages.length > 0;
  const count = showingExisting ? existingImages.length : newImages.length;
  const remaining = MAX_SERVICE_IMAGES - newImages.length;

  function handleImagesSelected(picked: LocalImage[]) {
    onChangeNewImages([...newImages, ...picked].slice(0, MAX_SERVICE_IMAGES));
  }

  function removeImage(index: number) {
    onChangeNewImages(newImages.filter((_, i) => i !== index));
  }

  async function pickFromGallery() {
    if (remaining <= 0) return;
    const picked = await pickImagesFromLibrary({
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
      permissionMessage: 'Allow photo library access to add work sample photos.',
    });
    if (!picked?.length) return;
    handleImagesSelected(
      picked.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'image/jpeg',
      })),
    );
  }

  if (compact) {
    return (
      <View style={styles.compactSection}>
        <View style={styles.heading}>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Add photos (optional)</Text>
            <Text style={styles.subtitle}>
              Workshop, machines or finished parts help buyers trust you
            </Text>
          </View>
          <Text style={styles.meta}>
            {newImages.length}/{MAX_SERVICE_IMAGES}
          </Text>
        </View>

        {newImages.length > 0 ? (
          <View style={styles.grid}>
            {newImages.map((image, index) => (
              <View key={`${image.uri}-${index}`} style={styles.compactImageWrap}>
                <Image source={{ uri: image.uri }} style={styles.image} contentFit="cover" />
                <Pressable style={styles.removeBtn} onPress={() => removeImage(index)}>
                  <Ionicons name="close" size={12} color={colors.white} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {remaining > 0 ? (
          <View style={styles.compactActions}>
            <Pressable
              style={styles.compactBtn}
              onPress={() => setCameraOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Take a work photo"
            >
              <Ionicons name="camera-outline" size={18} color={colors.accent} />
              <Text style={styles.compactBtnText}>Camera</Text>
            </Pressable>
            <Pressable
              style={styles.compactBtn}
              onPress={() => void pickFromGallery()}
              accessibilityRole="button"
              accessibilityLabel="Choose work photos from gallery"
            >
              <Ionicons name="images-outline" size={18} color={colors.accent} />
              <Text style={styles.compactBtnText}>Gallery</Text>
            </Pressable>
          </View>
        ) : null}

        <CameraCaptureModal
          visible={cameraOpen}
          onClose={() => setCameraOpen(false)}
          permissionMessage="Allow camera access to photograph your work."
          onCapture={(attachment) => {
            setCameraOpen(false);
            handleImagesSelected([
              {
                uri: attachment.uri,
                name: attachment.name || `service-${Date.now()}.jpg`,
                type: attachment.type || 'image/jpeg',
              },
            ]);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>Work samples</Text>
          <Text style={styles.subtitle}>
            Optional · photos of your workshop, machines or finished parts
          </Text>
        </View>
        <Text style={styles.meta}>
          {count}/{MAX_SERVICE_IMAGES}
        </Text>
      </View>

      {showingExisting ? (
        <>
          <View style={styles.grid}>
            {existingImages.map((path, index) => (
              <View key={`${path}-${index}`} style={styles.imageWrap}>
                <Image source={{ uri: getImageUrl(path) }} style={styles.image} contentFit="cover" />
              </View>
            ))}
          </View>
          {onStartReplace ? (
            <Pressable style={styles.replaceBtn} onPress={onStartReplace}>
              <Ionicons name="images-outline" size={18} color={colors.navy} />
              <Text style={styles.replaceText}>Replace or remove photos</Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <>
          <View style={styles.grid}>
            {newImages.map((image, index) => (
              <View key={`${image.uri}-${index}`} style={styles.imageWrap}>
                <Image source={{ uri: image.uri }} style={styles.image} contentFit="cover" />
                <Pressable style={styles.removeBtn} onPress={() => removeImage(index)}>
                  <Ionicons name="close" size={14} color={colors.white} />
                </Pressable>
              </View>
            ))}
            {newImages.length < MAX_SERVICE_IMAGES ? (
              <Pressable
                style={styles.addBtn}
                onPress={() => setSourceSheetOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Add work sample photos"
              >
                <Ionicons name="camera-outline" size={22} color={colors.accent} />
                <Text style={styles.addText}>Add</Text>
              </Pressable>
            ) : null}
          </View>
          {existingImages.length > 0 ? (
            <View style={styles.replaceHintRow}>
              <Text style={styles.hint}>
                {newImages.length
                  ? 'These photos will replace the current ones when you save.'
                  : 'Saving with no photos removes the current ones.'}
              </Text>
              {onKeepExisting ? (
                <Pressable onPress={onKeepExisting} hitSlop={6}>
                  <Text style={styles.link}>Keep current</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      <ProductImageSourceSheet
        visible={sourceSheetOpen}
        remainingSlots={MAX_SERVICE_IMAGES - newImages.length}
        onClose={() => setSourceSheetOpen(false)}
        onImagesSelected={handleImagesSelected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headingCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textStrong,
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageWrap: {
    width: 76,
    height: 76,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15, 27, 45, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 76,
    height: 76,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(92, 179, 53, 0.45)',
    backgroundColor: 'rgba(92, 179, 53, 0.06)',
  },
  addText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 12,
  },
  replaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  replaceText: {
    color: colors.navy,
    fontWeight: '700',
    fontSize: 14,
  },
  replaceHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hint: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  compactSection: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.bgSubtle,
  },
  compactImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  compactActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  compactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.borderAccent,
    backgroundColor: colors.white,
  },
  compactBtnText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});
