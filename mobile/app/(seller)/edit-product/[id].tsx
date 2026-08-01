import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { KeyboardAwareScrollView } from '@/src/components/KeyboardAwareScrollView';
import { Logo } from '@/src/components/Logo';
import { ProductForm } from '@/src/components/ProductForm';
import { ProductImageSourceSheet } from '@/src/components/ProductImageSourceSheet';
import { ScreenContent } from '@/src/components/ScreenContent';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import { getImageUrl, getProduct, updateProduct } from '@/src/lib/productsApi';
import {
  isAllowedProductCategory,
  isCompleteLocation,
  productToFormValues,
  type LocalImage,
  type ProductFormValues,
} from '@/src/types/product';

const MAX_IMAGES = 5;

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [replacingImages, setReplacingImages] = useState(false);
  const [newImages, setNewImages] = useState<LocalImage[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [form, setForm] = useState<ProductFormValues | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);

  useEffect(() => {
    const productId = id;
    if (!token || !productId) {
      setLoading(false);
      return;
    }

    const authToken = token;
    const safeProductId = productId;

    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError('');

      try {
        const data = await getProduct(authToken, safeProductId);
        if (cancelled) return;

        setForm(productToFormValues(data.product));
        setExistingImages(data.product.images);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load product');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [token, id]);

  function handleImagesSelected(picked: LocalImage[]) {
    setReplacingImages(true);
    setNewImages((current) => [...current, ...picked].slice(0, MAX_IMAGES));
  }

  function removeImage(index: number) {
    setNewImages((current) => current.filter((_, i) => i !== index));
  }

  function startReplacingImages() {
    setReplacingImages(true);
    setNewImages([]);
    setSourceSheetOpen(true);
  }

  function keepExistingImages() {
    setReplacingImages(false);
    setNewImages([]);
  }

  async function handleSubmit() {
    const productId = id;
    if (!token || !productId || !form) {
      setError('You must be signed in as a seller.');
      return;
    }

    const activeImages = replacingImages ? newImages : existingImages;
    if (!activeImages.length) {
      setError(replacingImages ? 'Add at least one product image.' : 'This listing has no images.');
      return;
    }

    if (replacingImages && !newImages.length) {
      setError('Add at least one product image to replace the current photos.');
      return;
    }

    if (!isCompleteLocation(form.location)) {
      setError('City, state, and pincode are required for the pickup location.');
      return;
    }

    if (!isAllowedProductCategory(form.category)) {
      setError('Please select a category from the list.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const imagesToUpload = replacingImages ? newImages : undefined;
      await updateProduct(token, productId, form, imagesToUpload);
      router.replace('/(seller)/(tabs)/listings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !form) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.accent} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!form) {
    return null;
  }

  const photoCount = replacingImages ? newImages.length : existingImages.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <ScreenContent style={styles.screenContent}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.accent} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Logo size="sm" />
        </View>

        <View style={styles.hero}>
          <Text style={styles.title}>Edit Listing</Text>
          <Text style={styles.subtitle}>
            Update details anytime. Replace photos only if you want new ones.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionMeta}>
              {photoCount}/{MAX_IMAGES}
            </Text>
          </View>

          {replacingImages ? (
            <>
              <Text style={styles.imageHint}>
                These photos will replace the current listing images when you save.
              </Text>
              <View style={styles.imageGrid}>
                {newImages.map((image, index) => (
                  <View key={`${image.uri}-${index}`} style={styles.imageWrap}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.imagePreview}
                      contentFit="cover"
                    />
                    <Pressable style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                      <Ionicons name="close" size={14} color={colors.white} />
                    </Pressable>
                  </View>
                ))}
                {newImages.length < MAX_IMAGES ? (
                  <Pressable
                    style={styles.addImageBtn}
                    onPress={() => setSourceSheetOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Add product photos"
                  >
                    <Ionicons name="camera-outline" size={24} color={colors.accent} />
                    <Text style={styles.addImageText}>Add</Text>
                  </Pressable>
                ) : null}
              </View>
              {existingImages.length > 0 ? (
                <Pressable onPress={keepExistingImages} hitSlop={6}>
                  <Text style={styles.linkText}>Keep current images</Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.imageGrid}>
                {existingImages.map((path, index) => (
                  <View key={`${path}-${index}`} style={styles.imageWrap}>
                    <Image
                      source={{ uri: getImageUrl(path) }}
                      style={styles.imagePreview}
                      contentFit="cover"
                    />
                  </View>
                ))}
              </View>
              <Pressable style={styles.replaceBtn} onPress={startReplacingImages}>
                <Ionicons name="images-outline" size={18} color={colors.navy} />
                <Text style={styles.replaceBtnText}>Replace photos</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.section}>
          <ProductForm values={form} onChange={setForm} profileAddress={user?.address} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Save changes</Text>
            )}
          </Pressable>
        </View>
        </ScreenContent>
      </KeyboardAwareScrollView>

      <ProductImageSourceSheet
        visible={sourceSheetOpen}
        remainingSlots={MAX_IMAGES - newImages.length}
        onClose={() => setSourceSheetOpen(false)}
        onImagesSelected={handleImagesSelected}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  screenContent: {
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 16,
  },
  hero: {
    gap: 6,
  },
  title: {
    color: colors.textStrong,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: 17,
    fontWeight: '800',
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  imageHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  linkText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageWrap: {
    width: 92,
    height: 92,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceMuted,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15, 27, 45, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageBtn: {
    width: 92,
    height: 92,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(92, 179, 53, 0.1)',
    gap: 4,
  },
  addImageText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  replaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 50,
  },
  replaceBtnText: {
    color: colors.navy,
    fontWeight: '700',
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: spacing.sm,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
});
