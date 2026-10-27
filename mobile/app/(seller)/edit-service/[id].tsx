import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { KeyboardAwareScrollView } from '@/src/components/KeyboardAwareScrollView';
import { Logo } from '@/src/components/Logo';
import { ScreenContent } from '@/src/components/ScreenContent';
import { ServiceForm } from '@/src/components/ServiceForm';
import { ServicePhotosSection } from '@/src/components/ServicePhotosSection';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import { getService, updateService } from '@/src/lib/servicesApi';
import type { LocalImage } from '@/src/types/product';
import {
  serviceToFormValues,
  validateServiceForm,
  type ServiceFormValues,
} from '@/src/types/service';

export default function EditServiceScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ServiceFormValues | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<LocalImage[]>([]);
  const [replacingImages, setReplacingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !id) {
      setLoading(false);
      return;
    }

    const authToken = token;
    const serviceId = id;
    let cancelled = false;

    async function loadService() {
      setLoading(true);
      setError('');
      try {
        const data = await getService(authToken, serviceId);
        if (cancelled) return;
        setForm(serviceToFormValues(data.service));
        setExistingImages(data.service.images);
        setReplacingImages(data.service.images.length === 0);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load service');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadService();

    return () => {
      cancelled = true;
    };
  }, [token, id]);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/(seller)/(tabs)/listings', params: { tab: 'services' } });
    }
  }

  async function handleSubmit() {
    if (!token || !id || !form) {
      setError('You must be signed in as a seller.');
      return;
    }

    const validationError = validateServiceForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await updateService(token, id, form, {
        images: replacingImages ? newImages : undefined,
        clearImages: replacingImages && !newImages.length && existingImages.length > 0,
      });
      router.replace({ pathname: '/(seller)/(tabs)/listings', params: { tab: 'services' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service');
    } finally {
      setSubmitting(false);
    }
  }

  const backButton = (
    <Pressable onPress={goBack} hitSlop={8} style={styles.backBtn}>
      <Ionicons name="chevron-back" size={20} color={colors.accent} />
      <Text style={styles.backText}>Back</Text>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!form) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.headerRow, styles.padded]}>{backButton}</View>
        <View style={styles.centered}>
          <Text style={styles.error}>{error || 'Service not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) },
        ]}
      >
        <ScreenContent style={styles.screenContent}>
          <View style={styles.headerRow}>
            {backButton}
            <Logo size="sm" />
          </View>

          <View style={styles.hero}>
            <Text style={styles.title}>Edit Service</Text>
            <Text style={styles.subtitle}>
              Keep your rates, capabilities and turnaround up to date.
            </Text>
          </View>

          <ServicePhotosSection
            newImages={newImages}
            onChangeNewImages={setNewImages}
            existingImages={existingImages}
            replacing={replacingImages}
            onStartReplace={() => {
              setReplacingImages(true);
              setNewImages([]);
            }}
            onKeepExisting={() => {
              setReplacingImages(false);
              setNewImages([]);
            }}
          />

          <ServiceForm values={form} onChange={setForm} profileAddress={user?.address} />

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
        </ScreenContent>
      </KeyboardAwareScrollView>
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
  },
  padded: {
    paddingHorizontal: spacing.lg,
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
  error: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
