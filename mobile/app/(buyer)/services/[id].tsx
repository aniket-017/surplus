import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DetailHeader,
  InquiryModal,
  ReportModal,
  SellerTrustCard,
} from '@/src/components/buyer/product-detail';
import type { ReportReasonValue } from '@/src/components/buyer/product-detail/ReportModal';
import { ServiceListingCard } from '@/src/components/buyer/ServiceListingCard';
import { ScreenContent } from '@/src/components/ScreenContent';
import { ServiceDetailsBody } from '@/src/components/ServiceDetailsBody';
import { useAuth } from '@/src/context/AuthContext';
import { colors, fonts, spacing } from '@/src/constants/theme';
import { getSavedStatus, startInquiry, toggleSavedListing } from '@/src/lib/conversationsApi';
import { reportListing } from '@/src/lib/reportsApi';
import { formatServicePrice } from '@/src/lib/serviceCategories';
import { getBrowseService, getSimilarServices } from '@/src/lib/servicesApi';
import { SERVICE_MODE_LABELS, type ServiceListing } from '@/src/types/service';

const STICKY_BAR_HEIGHT = 88;
const HORIZONTAL_PADDING = spacing.lg;

function buildQuoteMessage(service: ServiceListing) {
  return [
    `Hi, I'd like a quote for "${service.title}".`,
    'Job details:',
    'Material / part:',
    'Quantity:',
    'Required by:',
  ].join('\n');
}

function buildShareMessage(service: ServiceListing) {
  return [
    'Found this service on Surplus!',
    '',
    service.title,
    `${service.category} · ${formatServicePrice(service)}`,
    `${SERVICE_MODE_LABELS[service.serviceMode]} · ${service.location.city}`,
  ].join('\n');
}

export default function BuyerServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();

  const [service, setService] = useState<ServiceListing | null>(null);
  const [similar, setSimilar] = useState<ServiceListing[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inquiryVisible, setInquiryVisible] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReasonValue | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [detail, similarData, savedStatus] = await Promise.all([
        getBrowseService(token, id),
        getSimilarServices(token, id).catch(() => ({ services: [] as ServiceListing[] })),
        getSavedStatus(token, id).catch(() => ({ saved: false })),
      ]);
      setService(detail.service);
      setSimilar(similarData.services);
      setSaved(savedStatus.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service');
      setService(null);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggleSave() {
    if (!token || !service || saving) return;
    setSaving(true);
    try {
      const result = await toggleSavedListing(token, service.id);
      setSaved(result.saved);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update bookmark');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitInquiry() {
    if (!token || !service) return;
    setSubmitting(true);
    try {
      const result = await startInquiry(token, service.id, inquiryMessage || undefined);
      setInquiryVisible(false);
      setInquiryMessage('');
      router.push({ pathname: '/messages/[id]', params: { id: result.conversationId } });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitReport() {
    if (!token || !service || !reportReason || reportSubmitting) return;
    if (reportReason === 'OTHER' && !reportDetails.trim()) {
      Alert.alert('Details required', 'Please describe the issue for this report.');
      return;
    }

    setReportSubmitting(true);
    try {
      await reportListing(token, service.id, { reason: reportReason, details: reportDetails });
      setReportVisible(false);
      setReportReason(null);
      setReportDetails('');
      Alert.alert('Report submitted', 'Thanks. Our team will review this service.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  }

  const emptyHeader = (
    <DetailHeader
      onBack={() => router.back()}
      saved={false}
      onToggleSave={() => {}}
      onReport={() => {}}
      shareTitle=""
      shareMessage=""
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {emptyHeader}
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !service) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {emptyHeader}
        <View style={styles.centered}>
          <Text style={styles.error}>{error || 'Service not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnService = user?.id === service.sellerId;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <DetailHeader
        onBack={() => router.back()}
        saved={saved}
        onToggleSave={handleToggleSave}
        onReport={() => {
          setReportReason(null);
          setReportDetails('');
          setReportVisible(true);
        }}
        shareTitle={service.title}
        shareMessage={buildShareMessage(service)}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: STICKY_BAR_HEIGHT + insets.bottom + spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <ServiceDetailsBody service={service} horizontalPadding={HORIZONTAL_PADDING} />

        <ScreenContent>
          <View style={styles.content}>
            {(service.inquiryCount ?? 0) > 0 ? (
              <View style={styles.demandRow}>
                <Text style={styles.demandText}>
                  {service.inquiryCount} buyer{service.inquiryCount === 1 ? '' : 's'} already
                  enquired about this service
                </Text>
              </View>
            ) : null}

            <SellerTrustCard seller={service.seller} />

            {similar.length > 0 ? (
              <View style={styles.similar}>
                <Text style={styles.similarTitle}>More {service.category} providers</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.similarBleed}
                  contentContainerStyle={styles.similarRail}
                >
                  {similar.map((item) => (
                    <ServiceListingCard
                      key={item.id}
                      service={item}
                      width={172}
                      onPress={() =>
                        router.push({ pathname: '/(buyer)/services/[id]', params: { id: item.id } })
                      }
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </ScreenContent>
      </ScrollView>

      {!isOwnService ? (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <ScreenContent style={styles.barInner}>
            <View style={styles.barSummary}>
              <Text style={styles.barPrice}>{formatServicePrice(service)}</Text>
              <Text style={styles.barMeta} numberOfLines={1}>
                {service.minimumCharge != null
                  ? `Min. charge ₹${service.minimumCharge.toLocaleString('en-IN')}`
                  : SERVICE_MODE_LABELS[service.serviceMode]}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setInquiryMessage(buildQuoteMessage(service));
                setInquiryVisible(true);
              }}
              disabled={submitting}
              style={[styles.primaryButton, submitting && styles.primaryDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Request quote"
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.primaryText}>Request Quote</Text>
              )}
            </Pressable>
          </ScreenContent>
        </View>
      ) : null}

      <InquiryModal
        visible={inquiryVisible}
        title="Request a Quote"
        submitting={submitting}
        message={inquiryMessage}
        onChangeMessage={setInquiryMessage}
        onClose={() => {
          setInquiryVisible(false);
          setInquiryMessage('');
        }}
        onSubmit={handleSubmitInquiry}
      />

      <ReportModal
        visible={reportVisible}
        submitting={reportSubmitting}
        reason={reportReason}
        details={reportDetails}
        onChangeReason={setReportReason}
        onChangeDetails={setReportDetails}
        onClose={() => {
          setReportVisible(false);
          setReportReason(null);
          setReportDetails('');
        }}
        onSubmit={handleSubmitReport}
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
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  demandRow: {
    backgroundColor: 'rgba(234, 88, 12, 0.08)',
    borderRadius: 12,
    padding: spacing.sm,
  },
  demandText: {
    color: '#9A3412',
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  similar: {
    gap: spacing.sm,
  },
  similarTitle: {
    color: colors.textStrong,
    fontSize: 16,
    fontFamily: fonts.extrabold,
  },
  similarBleed: {
    marginHorizontal: -HORIZONTAL_PADDING,
  },
  similarRail: {
    gap: 10,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  barInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barSummary: {
    flex: 1,
    gap: 2,
  },
  barPrice: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  barMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  primaryDisabled: {
    opacity: 0.7,
  },
  primaryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
