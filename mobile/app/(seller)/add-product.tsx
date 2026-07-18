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
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Logo size="sm" />
        </View>

        <Text style={styles.title}>Add Product</Text>
        <Text style={styles.subtitle}>
          Upload up to 5 images, analyze with AI, review the details, then publish your listing.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Images</Text>
          <View style={styles.imageGrid}>
            {images.map((image, index) => (
              <View key={`${image.uri}-${index}`} style={styles.imageWrap}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} contentFit="cover" />
                <Pressable style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                  <Text style={styles.removeImageText}>×</Text>
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
                <View style={styles.addImageIcon}>
                  <Ionicons name="camera-outline" size={22} color={colors.accent} />
                </View>
                <Text style={styles.addImageText}>Add</Text>
                <Text style={styles.addImageHint}>Camera or gallery</Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable
            style={[styles.button, styles.buttonOutline, analyzing && styles.buttonDisabled]}
            onPress={handleAnalyze}
            disabled={analyzing || !images.length}
          >
            {analyzing ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={styles.buttonOutlineText}>Analyze with AI</Text>
            )}
          </Pressable>
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
              <Text style={styles.buttonText}>Publish listing</Text>
            )}
          </Pressable>
        </View>
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
    backgroundColor: colors.bgSubtle,
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
  buttonOutlineText: {
    color: colors.accent,
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
