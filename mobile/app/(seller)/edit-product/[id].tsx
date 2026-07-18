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
          <Pressable onPress={() => router.back()}>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Logo size="sm" />
        </View>

        <Text style={styles.title}>Edit Listing</Text>
        <Text style={styles.subtitle}>
          Update your listing details. Add new photos to replace the current images.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Images</Text>
          {replacingImages ? (
            <>
              <Text style={styles.imageHint}>
                New photos will replace the current listing images when you save.
              </Text>
              <View style={styles.imageGrid}>
                {newImages.map((image, index) => (
                  <View key={`${image.uri}-${index}`} style={styles.imageWrap}>
                    <Image source={{ uri: image.uri }} style={styles.imagePreview} contentFit="cover" />
                    <Pressable style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                      <Text style={styles.removeImageText}>×</Text>
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
                    <View style={styles.addImageIcon}>
                      <Ionicons name="camera-outline" size={22} color={colors.accent} />
                    </View>
                    <Text style={styles.addImageText}>Add</Text>
                    <Text style={styles.addImageHint}>Camera or gallery</Text>
                  </Pressable>
                ) : null}
              </View>
              {existingImages.length > 0 ? (
                <Pressable onPress={keepExistingImages}>
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
              <Pressable
                style={[styles.button, styles.buttonOutline]}
                onPress={startReplacingImages}
              >
                <Text style={styles.buttonOutlineText}>Replace images</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.card}>
          <ProductForm values={form} onChange={setForm} profileAddress={user?.address} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Save changes</Text>
            )}
          </Pressable>
        </View>
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
    backgroundColor: colors.bgSubtle,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backText: {
    color: colors.accent,
    fontWeight: '700',
  },
  title: {
    color: colors.textStrong,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
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
    width: 96,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  addImageBtn: {
    width: 96,
    height: 96,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderAccent,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(92, 179, 53, 0.06)',
    gap: 2,
    paddingHorizontal: 4,
  },
  addImageIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(92, 179, 53, 0.14)',
    marginBottom: 2,
  },
  addImageText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 13,
  },
  addImageHint: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  buttonOutlineText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  error: {
    color: colors.error,
    fontSize: 14,
  },
});
