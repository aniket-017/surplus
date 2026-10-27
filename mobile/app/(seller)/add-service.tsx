import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AnalyzeAiOverlay, type AnalyzeCaption } from '@/src/components/AnalyzeAiOverlay';
import { ServiceListingCard } from '@/src/components/buyer/ServiceListingCard';
import { KeyboardAwareScrollView } from '@/src/components/KeyboardAwareScrollView';
import { Logo } from '@/src/components/Logo';
import { PublishOverlay } from '@/src/components/PublishOverlay';
import { ScreenContent } from '@/src/components/ScreenContent';
import { ServicePhotosSection } from '@/src/components/ServicePhotosSection';
import {
  AiServiceStarter,
  type AiStarterStatus,
} from '@/src/components/service-form/AiServiceStarter';
import { ServiceAvailabilitySection } from '@/src/components/service-form/ServiceAvailabilitySection';
import { ServiceBasicsSection } from '@/src/components/service-form/ServiceBasicsSection';
import { ServiceCapabilitiesSection } from '@/src/components/service-form/ServiceCapabilitiesSection';
import { ServiceExperienceSection } from '@/src/components/service-form/ServiceExperienceSection';
import { ServicePricingSection } from '@/src/components/service-form/ServicePricingSection';
import { ServiceQualityTips } from '@/src/components/service-form/ServiceQualityTips';
import { SectionHeader } from '@/src/components/service-form/shared';
import { useAuth } from '@/src/context/AuthContext';
import { colors, radius, spacing } from '@/src/constants/theme';
import { clearServiceDraft, useServiceDraft } from '@/src/hooks/useServiceDraft';
import {
  analyzeServicePhotos,
  createService,
  draftServiceFromText,
  getService,
} from '@/src/lib/servicesApi';
import { isCompleteLocation, profileAddressToLocation } from '@/src/types/product';
import {
  emptyServiceForm,
  serviceToFormValues,
  validateServiceForm,
  validateServiceStep,
  type ServiceFormStep,
  type ServiceListing,
} from '@/src/types/service';

const STEP_TITLES: Record<ServiceFormStep, { title: string; subtitle: string }> = {
  1: { title: 'What work do you do?', subtitle: 'Category, title and description' },
  2: { title: 'Capabilities & pricing', subtitle: 'What you can do and how you charge' },
  3: { title: 'Availability & publish', subtitle: 'Where you work, photos and preview' },
};

const PHOTO_CAPTIONS: readonly AnalyzeCaption[] = [
  { title: 'Looking at your work', subtitle: 'Spotting machines and processes' },
  { title: 'Matching the service', subtitle: 'Picking the right category' },
  { title: 'Drafting your listing', subtitle: 'Preparing title and description' },
];

export default function AddServiceScreen() {
  const { duplicateFrom } = useLocalSearchParams<{ duplicateFrom?: string }>();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const draft = useServiceDraft({ persist: !duplicateFrom });
  const { form, setForm, prefill, images, setImages, step, setStep } = draft;

  const [starterStatus, setStarterStatus] = useState<AiStarterStatus>('idle');
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [improving, setImproving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishSucceeded, setPublishSucceeded] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.address && isCompleteLocation(user.address)) {
      prefill((current) =>
        isCompleteLocation(current.location)
          ? current
          : { ...current, location: profileAddressToLocation(user.address!) },
      );
    }
  }, [user?.address, prefill]);

  useEffect(() => {
    if (!token || !duplicateFrom) return;
    let cancelled = false;
    getService(token, duplicateFrom)
      .then(({ service }) => {
        if (cancelled) return;
        const values = serviceToFormValues(service);
        setForm({ ...values, title: `${values.title} (copy)` });
        setStarterStatus('manual');
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load service');
      });
    return () => {
      cancelled = true;
    };
  }, [token, duplicateFrom, setForm]);

  function exitScreen() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(seller)/(tabs)');
    }
  }

  async function handleGenerate(text: string) {
    if (!token) return;
    setGenerating(true);
    setError('');
    try {
      const result = await draftServiceFromText(token, {
        text,
        category: form.category || undefined,
      });
      draft.applyAiValues(result);
      setStarterStatus('drafted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI could not draft your listing');
    } finally {
      setGenerating(false);
    }
  }

  async function handlePhotosPicked(picked: typeof images) {
    if (!token) return;
    const nextImages = [...images, ...picked].slice(0, 5);
    setImages(nextImages);
    setAnalyzing(true);
    setError('');
    try {
      const analysis = await analyzeServicePhotos(token, picked);
      draft.applyAiValues({
        category: analysis.category,
        title: analysis.title,
        description: analysis.caption,
        capabilities: analysis.visibleProcesses,
      });
      setStarterStatus('drafted');
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message}. Your photos are kept; fill the details below.`
          : 'Could not analyze photos',
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleImprove() {
    if (!token) return;
    setImproving(true);
    setError('');
    try {
      const result = await draftServiceFromText(token, {
        category: form.category || undefined,
        title: form.title,
        description: form.description,
      });
      draft.applyAiValues({ title: result.title, description: result.description });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI could not improve the text');
    } finally {
      setImproving(false);
    }
  }

  function goNext() {
    const validationError = validateServiceStep(step, form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    if (step < 3) setStep((step + 1) as ServiceFormStep);
  }

  function goPrevious() {
    setError('');
    if (step > 1) setStep((step - 1) as ServiceFormStep);
  }

  async function handleSubmit() {
    if (!token) {
      setError('You must be signed in as a seller.');
      return;
    }

    const validationError = validateServiceForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    draft.pauseAutosave(true);
    setSubmitting(true);
    setPublishSucceeded(false);
    setError('');

    try {
      await createService(token, images, form);
      if (!duplicateFrom) await clearServiceDraft();
      setPublishSucceeded(true);
      await new Promise((resolve) => setTimeout(resolve, 700));
      setPublished(true);
    } catch (err) {
      draft.pauseAutosave(false);
      setPublishSucceeded(false);
      setError(err instanceof Error ? err.message : 'Failed to publish service');
    } finally {
      setSubmitting(false);
    }
  }

  function addAnotherService() {
    draft.reset({
      ...emptyServiceForm(),
      location: form.location,
      serviceMode: form.serviceMode,
    });
    draft.pauseAutosave(false);
    setStarterStatus('idle');
    setPublishSucceeded(false);
    setPublished(false);
    setError('');
  }

  const previewWidth = Math.min(screenWidth - spacing.lg * 2, 280);
  const preview = useMemo<ServiceListing>(
    () => ({
      id: 'preview',
      listingType: 'service',
      sellerId: user?.id ?? '',
      title: form.title || 'Your service title',
      category: form.category || 'Others',
      description: form.description,
      price: Number(form.price) || 0,
      priceType: form.priceType,
      listingStatus: 'active',
      images: images.map((image) => image.uri),
      location: form.location,
      capabilities: form.capabilities,
      experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
      serviceMode: form.serviceMode,
      turnaround: form.turnaround || null,
      minimumCharge: form.minimumCharge ? Number(form.minimumCharge) : null,
      createdAt: '',
      updatedAt: '',
      seller: user
        ? { id: user.id, name: user.name || 'You', email: user.email ?? '', avatarUrl: user.avatarUrl }
        : null,
    }),
    [form, images, user],
  );

  if (published) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={36} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Your service is live</Text>
          <Text style={styles.successSubtitle}>
            Nearby industries can now find &quot;{form.title}&quot; and send enquiries.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={addAnotherService}>
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.primaryBtnText}>Add another service</Text>
          </Pressable>
          <Text style={styles.successHint}>Uses the same workshop location</Text>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() =>
              router.replace({ pathname: '/(seller)/(tabs)/listings', params: { tab: 'services' } })
            }
          >
            <Text style={styles.secondaryBtnText}>View my services</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const stepInfo = STEP_TITLES[step];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScrollView
        key={`step-${step}`}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) },
        ]}
      >
        <ScreenContent style={styles.screenContent}>
          <View style={styles.headerRow}>
            <Pressable onPress={exitScreen} hitSlop={8} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color={colors.accent} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
            <Logo size="sm" />
          </View>

          {draft.savedDraft ? (
            <View style={styles.resumeCard}>
              <Ionicons name="document-text-outline" size={18} color={colors.navy} />
              <Text style={styles.resumeText} numberOfLines={2}>
                Continue your unfinished service
                {draft.savedDraft.form.title ? `: "${draft.savedDraft.form.title}"` : ''}?
              </Text>
              <Pressable onPress={() => void draft.discardDraft()} hitSlop={6}>
                <Text style={styles.resumeDiscard}>Discard</Text>
              </Pressable>
              <Pressable
                style={styles.resumeBtn}
                onPress={() => {
                  draft.resumeDraft();
                  setStarterStatus('manual');
                }}
              >
                <Text style={styles.resumeBtnText}>Resume</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.hero}>
            <Text style={styles.badge}>Offer a service · Step {step} of 3</Text>
            <View style={styles.progressTrack}>
              {[1, 2, 3].map((item) => (
                <View
                  key={item}
                  style={[styles.progressSegment, item <= step && styles.progressSegmentActive]}
                />
              ))}
            </View>
            <Text style={styles.title}>{stepInfo.title}</Text>
            <Text style={styles.subtitle}>{stepInfo.subtitle}</Text>
          </View>

          {step === 1 ? (
            <>
              <AiServiceStarter
                status={starterStatus}
                generating={generating}
                onGenerate={(text) => void handleGenerate(text)}
                onPhotosPicked={(picked) => void handlePhotosPicked(picked)}
                onManual={() => setStarterStatus('manual')}
                onReopen={() => setStarterStatus('idle')}
              />
              <SectionHeader
                title="Service details"
                subtitle={
                  starterStatus === 'idle'
                    ? 'Or pick a category and write it yourself'
                    : 'Review and edit before continuing'
                }
              />
              <ServiceBasicsSection
                values={form}
                onChange={setForm}
                showHeader={false}
                aiFields={draft.aiFields}
                pending={draft.pending}
                onAcceptPending={draft.acceptPending}
                onDismissPending={draft.dismissPending}
                onImprove={() => void handleImprove()}
                improving={improving}
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <ServiceCapabilitiesSection
                values={form}
                onChange={setForm}
                aiSuggested={draft.aiFields.has('capabilities')}
                showHeader={false}
              />
              <ServicePricingSection values={form} onChange={setForm} />
              <ServiceExperienceSection
                values={form}
                onChange={setForm}
                turnaroundAiSuggested={draft.aiFields.has('turnaround')}
              />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <ServiceAvailabilitySection
                values={form}
                onChange={setForm}
                profileAddress={user?.address}
                serviceModeAiSuggested={draft.aiFields.has('serviceMode')}
                showHeader={false}
              />
              <ServicePhotosSection newImages={images} onChangeNewImages={setImages} compact />
              <SectionHeader title="Preview" subtitle="How buyers will see your service" />
              <View style={styles.previewWrap}>
                <ServiceListingCard service={preview} width={previewWidth} onPress={() => undefined} />
              </View>
              <ServiceQualityTips form={form} photoCount={images.length} />
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.footer}>
            {step > 1 ? (
              <Pressable style={styles.footerBack} onPress={goPrevious}>
                <Ionicons name="arrow-back" size={18} color={colors.navy} />
              </Pressable>
            ) : null}
            {step < 3 ? (
              <Pressable style={[styles.primaryBtn, styles.footerPrimary]} onPress={goNext}>
                <Text style={styles.primaryBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              </Pressable>
            ) : (
              <Pressable
                style={[styles.primaryBtn, styles.footerPrimary, submitting && styles.disabled]}
                onPress={handleSubmit}
                disabled={submitting || publishSucceeded}
              >
                <Text style={styles.primaryBtnText}>Publish service</Text>
              </Pressable>
            )}
          </View>

          {!duplicateFrom ? (
            <Text style={styles.autosave}>
              <Ionicons name="cloud-done-outline" size={12} color={colors.muted} />{' '}
              {draft.lastSavedAt
                ? 'Progress saved on this device'
                : 'Your progress is saved automatically'}
            </Text>
          ) : null}
        </ScreenContent>
      </KeyboardAwareScrollView>

      <AnalyzeAiOverlay visible={analyzing} images={images} captions={PHOTO_CAPTIONS} />
      <PublishOverlay
        visible={submitting || publishSucceeded}
        images={images}
        succeeded={publishSucceeded}
        successSubtitle="Your service is now live"
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
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resumeText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  resumeDiscard: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  resumeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  resumeBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  hero: {
    gap: 6,
  },
  badge: {
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
    gap: 6,
    marginVertical: 6,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceMuted,
  },
  progressSegmentActive: {
    backgroundColor: colors.accent,
  },
  title: {
    color: colors.textStrong,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  previewWrap: {
    alignItems: 'center',
  },
  error: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  footerBack: {
    width: 52,
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  footerPrimary: {
    flex: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.7,
  },
  autosave: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: -spacing.xs,
  },
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    marginBottom: spacing.sm,
  },
  successTitle: {
    color: colors.textStrong,
    fontSize: 24,
    fontWeight: '800',
  },
  successSubtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  successHint: {
    color: colors.muted,
    fontSize: 12,
  },
  secondaryBtn: {
    marginTop: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
  },
  secondaryBtnText: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '700',
  },
});
