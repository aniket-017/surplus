import { Image } from 'expo-image';
import { router } from 'expo-router';
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
import { analyzeProductImages, createProduct } from '@/src/lib/productsApi';
import {
  emptyProductForm,
  isAllowedProductCategory,
  isCompleteLocation,
  profileAddressToLocation,
  type LocalImage,
  type ProductFormValues,
} from '@/src/types/product';

const MAX_IMAGES = 5;

export default function AddProductScreen() {
  const { token, user } = useAuth();
  const [images, setImages] = useState<LocalImage[]>([]);
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm());
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);

  useEffect(() => {
    if (user?.address && isCompleteLocation(user.address)) {
      setForm((current) => ({
        ...current,
        location: profileAddressToLocation(user.address!),
      }));
    }
  }, [user?.address]);

  function handleImagesSelected(picked: LocalImage[]) {
    setImages((current) => [...current, ...picked].slice(0, MAX_IMAGES));
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, i) => i !== index));
  }

  async function handleAnalyze() {
    if (!token) {
      setError('You must be signed in as a seller.');
      return;
    }

    if (!images.length) {
      setError('Add at least one product image before analyzing.');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const { analysis } = await analyzeProductImages(token, images);
      setForm((current) => ({
        ...current,
        title: analysis.title,
        category: analysis.category,
        subCategory: analysis.subCategory,
        description: analysis.description,
        quantityUnit: analysis.quantityUnit,
        attributes: analysis.attributes,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze images');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit() {
    if (!token) {
      setError('You must be signed in as a seller.');
      return;
    }

    if (!images.length) {
      setError('Add at least one product image.');
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
      await createProduct(token, images, form);
      router.replace('/(seller)/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish product');
    } finally {
      setSubmitting(false);
    }
  }

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
          <Text style={styles.title}>Add Product</Text>
          <Text style={styles.subtitle}>
            Add photos, let AI draft the listing, then review and publish.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionMeta}>{images.length}/{MAX_IMAGES}</Text>
          </View>

          <View style={styles.imageGrid}>
            {images.map((image, index) => (
              <View key={`${image.uri}-${index}`} style={styles.imageWrap}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} contentFit="cover" />
                <Pressable style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                  <Ionicons name="close" size={14} color={colors.white} />
                </Pressable>
              </View>
            ))}
            {images.length < MAX_IMAGES ? (
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

          <Pressable
            style={[
              styles.analyzeBtn,
              (!images.length || analyzing) && styles.analyzeBtnDisabled,
            ]}
            onPress={handleAnalyze}
            disabled={analyzing || !images.length}
          >
            {analyzing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={18} color={colors.white} />
                <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.section}>
          <ProductForm values={form} onChange={setForm} profileAddress={user?.address} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.publishBtn, submitting && styles.publishBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.publishBtnText}>Publish listing</Text>
            )}
          </Pressable>
        </View>
        </ScreenContent>
      </KeyboardAwareScrollView>

      <ProductImageSourceSheet
        visible={sourceSheetOpen}
        remainingSlots={MAX_IMAGES - images.length}
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
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.navy,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 50,
  },
  analyzeBtnDisabled: {
    opacity: 0.55,
  },
  analyzeBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  publishBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: spacing.sm,
  },
  publishBtnDisabled: {
    opacity: 0.7,
  },
  publishBtnText: {
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
