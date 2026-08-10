import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AnalyzeAiOverlay } from '@/src/components/AnalyzeAiOverlay';
import { KeyboardAwareScrollView } from '@/src/components/KeyboardAwareScrollView';
import { Logo } from '@/src/components/Logo';
import { ProductForm } from '@/src/components/ProductForm';
import { ProductImageSourceSheet } from '@/src/components/ProductImageSourceSheet';
import { PublishOverlay } from '@/src/components/PublishOverlay';
import { ScreenContent } from '@/src/components/ScreenContent';
import { useAuth } from '@/src/context/AuthContext';
import { colors, radius, spacing } from '@/src/constants/theme';
import { analyzeProductImages, createProduct } from '@/src/lib/productsApi';
import {
  emptyProductForm,
  humanizeAttributes,
  isAllowedProductCategory,
  isCompleteLocation,
  profileAddressToLocation,
  type LocalImage,
  type ProductFormValues,
} from '@/src/types/product';

const MAX_IMAGES = 5;

type Step = 'photos' | 'details';

export default function AddProductScreen() {
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const analyzeLockRef = useRef(false);
  const [step, setStep] = useState<Step>('photos');
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm());
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishSucceeded, setPublishSucceeded] = useState(false);
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

  function invalidateAnalysis() {
    setHasAnalyzed(false);
    setStep('photos');
    setError('');
  }

  function handleImagesSelected(picked: LocalImage[]) {
    const shouldInvalidate = hasAnalyzed || step === 'details';
    setImages((current) => [...current, ...picked].slice(0, MAX_IMAGES));
    if (shouldInvalidate) {
      invalidateAnalysis();
    }
  }

  function removeImage(index: number) {
    const shouldInvalidate = hasAnalyzed || step === 'details';
    setImages((current) => current.filter((_, i) => i !== index));
    if (shouldInvalidate) {
      invalidateAnalysis();
    }
  }

  function handleBack() {
    if (step === 'details') {
      setStep('photos');
      setError('');
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(seller)/(tabs)');
    }
  }

  async function handleAnalyze() {
    if (analyzeLockRef.current || analyzing) {
      return;
    }

    if (!token) {
      setError('You must be signed in as a seller.');
      return;
    }

    if (!images.length) {
      setError('Add at least one product image before analyzing.');
      return;
    }

    analyzeLockRef.current = true;
    setError('');
    // Start upload before overlay paint so Android FormData work isn't delayed by Modal mount.
    const analysisPromise = analyzeProductImages(token, images);
    setAnalyzing(true);

    try {
      const { analysis } = await analysisPromise;
      setForm((current) => ({
        ...current,
        title: analysis.title,
        category: analysis.category,
        subCategory: analysis.subCategory,
        description: analysis.description,
        quantityUnit: analysis.quantityUnit,
        attributes: humanizeAttributes(analysis.attributes),
      }));
      setHasAnalyzed(true);
      setStep('details');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze images');
    } finally {
      analyzeLockRef.current = false;
      setAnalyzing(false);
    }
  }

  async function handleSubmit() {
    if (!token) {
      setError('You must be signed in as a seller.');
      return;
    }

    if (!hasAnalyzed) {
      setError('Analyze your photos with AI before publishing.');
      setStep('photos');
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
    setPublishSucceeded(false);
    setError('');

    try {
      await createProduct(token, images, form);
      setPublishSucceeded(true);
      await new Promise((resolve) => setTimeout(resolve, 700));
      router.replace('/(seller)/(tabs)');
    } catch (err) {
      setPublishSucceeded(false);
      setError(err instanceof Error ? err.message : 'Failed to publish product');
      setSubmitting(false);
    }
  }

  const isPhotosStep = step === 'photos';

  const header = (
    <>
      <View style={styles.headerRow}>
        <Pressable onPress={handleBack} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Logo size="sm" />
      </View>

      <View style={styles.progressBlock}>
        <Text style={styles.stepBadge}>
          {isPhotosStep ? 'Step 1 of 2' : 'Step 2 of 2'}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressSeg, styles.progressSegActive]} />
          <View
            style={[styles.progressSeg, !isPhotosStep && styles.progressSegActive]}
          />
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.title}>
          {isPhotosStep ? 'Add photos' : 'Review listing'}
        </Text>
        <Text style={styles.subtitle}>
          {isPhotosStep
            ? 'Upload clear photos of your surplus. AI will draft the listing next — this step is required.'
            : 'AI drafted your listing from the photos. Edit anything that looks off, then publish.'}
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {isPhotosStep ? (
        <View style={styles.photosLayout}>
          <KeyboardAwareScrollView
            style={styles.photosScroll}
            contentContainerStyle={styles.photosScrollContent}
          >
            <ScreenContent style={styles.screenContent}>
              {header}

              <View style={styles.section}>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>Photos</Text>
                  <Text style={styles.sectionMeta}>
                    {images.length}/{MAX_IMAGES}
                  </Text>
                </View>

                {images.length === 0 ? (
                  <Pressable
                    style={styles.emptyAddZone}
                    onPress={() => setSourceSheetOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Add product photos"
                  >
                    <View style={styles.emptyAddIcon}>
                      <Ionicons name="camera-outline" size={32} color={colors.accent} />
                    </View>
                    <Text style={styles.emptyAddTitle}>Add product photos</Text>
                    <Text style={styles.emptyAddHint}>
                      Up to {MAX_IMAGES} photos · Camera or gallery
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.imageGrid}>
                    {images.map((image, index) => (
                      <View key={`${image.uri}-${index}`} style={styles.imageWrap}>
                        <Image
                          source={{ uri: image.uri }}
                          style={styles.imagePreview}
                          contentFit="cover"
                        />
                        <Pressable
                          style={styles.removeImageBtn}
                          onPress={() => removeImage(index)}
                        >
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
                )}

                {error ? <Text style={styles.error}>{error}</Text> : null}
              </View>
            </ScreenContent>
          </KeyboardAwareScrollView>

          <View style={[styles.stickyCta, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Text style={styles.stickyCtaHint}>
              AI will identify the product, category, description and other details.
            </Text>
            <Pressable
              style={[
                styles.analyzeBtn,
                (!images.length || analyzing) && styles.analyzeBtnDisabled,
              ]}
              onPress={handleAnalyze}
              disabled={analyzing || !images.length}
            >
              <Ionicons name="sparkles-outline" size={18} color={colors.white} />
              <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <KeyboardAwareScrollView
          contentContainerStyle={[
            styles.container,
            { paddingBottom: Math.max(insets.bottom, spacing.xl) },
          ]}
        >
          <ScreenContent style={styles.screenContent}>
            {header}

            <View style={styles.section}>
              <View style={styles.draftCue}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                <Text style={styles.draftCueText}>
                  Draft ready — review before publishing
                </Text>
              </View>

              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <Text style={styles.sectionMeta}>
                  {images.length}/{MAX_IMAGES}
                </Text>
              </View>

              <View style={styles.imageGrid}>
                {images.map((image, index) => (
                  <View key={`${image.uri}-${index}`} style={styles.imageWrapCompact}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.imagePreview}
                      contentFit="cover"
                    />
                    <Pressable
                      style={styles.removeImageBtn}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close" size={14} color={colors.white} />
                    </Pressable>
                  </View>
                ))}
                {images.length < MAX_IMAGES ? (
                  <Pressable
                    style={styles.addImageBtnCompact}
                    onPress={() => setSourceSheetOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Add product photos"
                  >
                    <Ionicons name="add" size={22} color={colors.accent} />
                  </Pressable>
                ) : null}
              </View>

              <Text style={styles.photoEditHint}>
                Changing photos returns you to Step 1 to re-analyze
              </Text>

              <ProductForm values={form} onChange={setForm} profileAddress={user?.address} />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={[styles.publishBtn, submitting && styles.publishBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting || publishSucceeded}
              >
                <Text style={styles.publishBtnText}>Publish listing</Text>
              </Pressable>
            </View>
          </ScreenContent>
        </KeyboardAwareScrollView>
      )}

      <ProductImageSourceSheet
        visible={sourceSheetOpen}
        remainingSlots={MAX_IMAGES - images.length}
        onClose={() => setSourceSheetOpen(false)}
        onImagesSelected={handleImagesSelected}
      />

      <AnalyzeAiOverlay visible={analyzing} images={images} />
      <PublishOverlay
        visible={submitting || publishSucceeded}
        images={images}
        succeeded={publishSucceeded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  photosLayout: {
    flex: 1,
  },
  photosScroll: {
    flex: 1,
  },
  photosScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
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
  progressBlock: {
    gap: spacing.sm,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    color: colors.accentHover,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 8,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15, 27, 45, 0.1)',
  },
  progressSegActive: {
    backgroundColor: colors.accent,
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
  emptyAddZone: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 180,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(92, 179, 53, 0.45)',
    backgroundColor: 'rgba(92, 179, 53, 0.06)',
  },
  emptyAddIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(92, 179, 53, 0.14)',
    marginBottom: 4,
  },
  emptyAddTitle: {
    color: colors.textStrong,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyAddHint: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
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
  imageWrapCompact: {
    width: 72,
    height: 72,
    borderRadius: 12,
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
  addImageBtnCompact: {
    width: 72,
    height: 72,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(92, 179, 53, 0.1)',
  },
  addImageText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  photoEditHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
  draftCue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(92, 179, 53, 0.1)',
  },
  draftCueText: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  stickyCta: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  stickyCtaHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.navy,
    borderRadius: 14,
    paddingVertical: 16,
    minHeight: 54,
  },
  analyzeBtnDisabled: {
    opacity: 0.55,
  },
  analyzeBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
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
