import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KeyboardAwareScrollView } from '@/src/components/KeyboardAwareScrollView';
import { Logo } from '@/src/components/Logo';
import { ProductForm } from '@/src/components/ProductForm';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import { analyzeProductImages, createProduct } from '@/src/lib/productsApi';
import {
  emptyProductForm,
  type LocalImage,
  type ProductFormValues,
} from '@/src/types/product';

const MAX_IMAGES = 5;

export default function AddProductScreen() {
  const { token } = useAuth();
  const [images, setImages] = useState<LocalImage[]>([]);
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm());
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function pickImages() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo library access to upload product images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.85,
    });

    if (result.canceled) return;

    const picked = result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName || `product-${Date.now()}-${index}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    }));

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
              <Pressable style={styles.addImageBtn} onPress={pickImages}>
                <Text style={styles.addImageText}>+ Add</Text>
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
          <ProductForm values={form} onChange={setForm} />

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
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  addImageText: {
    color: colors.accent,
    fontWeight: '700',
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
