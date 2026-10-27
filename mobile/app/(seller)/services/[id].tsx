import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ServiceDetailsBody } from '@/src/components/ServiceDetailsBody';
import { useAuth } from '@/src/context/AuthContext';
import { colors, fonts, spacing } from '@/src/constants/theme';
import { deleteService, getService, setServiceStatus } from '@/src/lib/servicesApi';
import type { Service } from '@/src/types/service';

const HORIZONTAL_PADDING = 20;

export default function SellerServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      const data = await getService(token, id);
      setService(data.service);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/(seller)/(tabs)/listings', params: { tab: 'services' } });
    }
  }

  async function toggleStatus() {
    if (!token || !service || busy) return;
    setBusy(true);
    try {
      const next = service.listingStatus === 'paused' ? 'active' : 'paused';
      const data = await setServiceStatus(token, service.id, next);
      setService((current) => (current ? { ...current, ...data.service } : data.service));
    } catch (err) {
      Alert.alert('Could not update service', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!token || !service) return;
    Alert.alert('Delete Service', `Delete "${service.title}"? Buyers will no longer see it.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteService(token, service.id);
            goBack();
          } catch (err) {
            Alert.alert('Could not delete service', err instanceof Error ? err.message : 'Try again.');
            setBusy(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.error}>{error || 'Service not found'}</Text>
        <Pressable onPress={goBack} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isDeleted = service.listingStatus === 'deleted';
  const isPaused = service.listingStatus === 'paused';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <ServiceDetailsBody service={service} horizontalPadding={HORIZONTAL_PADDING} />

        <View style={styles.statsCard}>
          <Stat icon="eye-outline" label="Views" value={service.viewCount ?? 0} />
          <View style={styles.statDivider} />
          <Stat icon="chatbubbles-outline" label="Enquiries" value={service.inquiryCount ?? 0} />
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text
              style={[
                styles.statusText,
                isPaused && styles.statusPaused,
                isDeleted && styles.statusDeleted,
              ]}
            >
              {isDeleted ? 'Deleted' : isPaused ? 'Paused' : 'Active'}
            </Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>
      </ScrollView>

      <Pressable
        onPress={goBack}
        style={[styles.backFab, { top: insets.top + 8 }]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="chevron-back" size={22} color={colors.textStrong} />
      </Pressable>

      {!isDeleted ? (
        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable style={styles.iconAction} onPress={confirmDelete} disabled={busy}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
          <Pressable
            style={[styles.iconAction, styles.duplicateAction]}
            onPress={() =>
              router.push({ pathname: '/(seller)/add-service', params: { duplicateFrom: service.id } })
            }
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Duplicate service"
          >
            <Ionicons name="copy-outline" size={20} color={colors.navy} />
          </Pressable>
          <Pressable style={styles.secondaryAction} onPress={toggleStatus} disabled={busy}>
            {busy ? (
              <ActivityIndicator color={colors.navy} />
            ) : (
              <>
                <Ionicons
                  name={isPaused ? 'play-circle-outline' : 'pause-circle-outline'}
                  size={18}
                  color={colors.navy}
                />
                <Text style={styles.secondaryActionText}>{isPaused ? 'Resume' : 'Pause'}</Text>
              </>
            )}
          </Pressable>
          <Pressable
            style={styles.primaryAction}
            onPress={() =>
              router.push({ pathname: '/(seller)/edit-service/[id]', params: { id: service.id } })
            }
          >
            <Ionicons name="create-outline" size={18} color={colors.white} />
            <Text style={styles.primaryActionText}>Edit</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statValueRow}>
        <Ionicons name={icon} size={16} color={colors.accent} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bgSubtle,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  backFab: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: HORIZONTAL_PADDING,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statValue: {
    color: colors.textStrong,
    fontSize: 18,
    fontFamily: fonts.extrabold,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  statusText: {
    color: colors.accent,
    fontSize: 16,
    fontFamily: fonts.extrabold,
  },
  statusPaused: {
    color: '#B45309',
  },
  statusDeleted: {
    color: '#607D8B',
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  iconAction: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(192, 57, 43, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duplicateAction: {
    borderColor: colors.border,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: colors.navy,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  secondaryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  secondaryBtnText: {
    color: colors.navy,
    fontFamily: fonts.bold,
  },
});
