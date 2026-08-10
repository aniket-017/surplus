import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DescriptionOverview,
  DetailHeader,
  InquiryModal,
  InquiryUrgency,
  LocationSection,
  MarketRateCard,
  ProductDetailSkeleton,
  ProductGallery,
  ProductHero,
  QuickStatsRow,
  ReportModal,
  SellerTrustCard,
  SimilarListings,
  SpecsGrid,
  StickyActionBar,
  WhyBuySection,
} from '@/src/components/buyer/product-detail';
import type { ReportReasonValue } from '@/src/components/buyer/product-detail/ReportModal';
import { ScreenContent } from '@/src/components/ScreenContent';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import {
  computeMarketRange,
  getProductStats,
  getSavedStatus,
  getSimilarProducts,
  startInquiry,
  toggleSavedListing,
} from '@/src/lib/conversationsApi';
import { buildProductShareMessage } from '@/src/lib/productFormat';
import { browseProducts, getBrowseProduct } from '@/src/lib/productsApi';
import { reportListing } from '@/src/lib/reportsApi';
import type { ProductListing } from '@/src/types/product';

const STICKY_BAR_HEIGHT = 88;

export default function BuyerProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState<ProductListing | null>(null);
  const [similar, setSimilar] = useState<ProductListing[]>([]);
  const [marketRange, setMarketRange] = useState<{ min: number; max: number } | null>(null);
  const [inquiryCount, setInquiryCount] = useState(0);
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

  const loadProduct = useCallback(async () => {
    if (!token || !id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [detail, stats, similarData, savedStatus] = await Promise.all([
        getBrowseProduct(token, id),
        getProductStats(token, id).catch(() => ({ inquiryCount: 0, savedCount: 0 })),
        getSimilarProducts(token, id).catch(() => ({ products: [] as ProductListing[] })),
        getSavedStatus(token, id).catch(() => ({ saved: false })),
      ]);

      setProduct(detail.product);
      setInquiryCount(stats.inquiryCount);
      setSimilar(similarData.products);
      setSaved(savedStatus.saved);

      const categoryProducts = await browseProducts(token, {
        category: detail.product.category,
        limit: 20,
      }).catch(() => ({ products: [] as ProductListing[] }));

      setMarketRange(computeMarketRange(categoryProducts.products, detail.product.priceType));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  async function handleToggleSave() {
    if (!token || !product || saving) return;

    setSaving(true);
    try {
      const result = await toggleSavedListing(token, product.id);
      setSaved(result.saved);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update bookmark');
    } finally {
      setSaving(false);
    }
  }

  function openInquiryModal() {
    setInquiryMessage('');
    setInquiryVisible(true);
  }

  function openReportModal() {
    setReportReason(null);
    setReportDetails('');
    setReportVisible(true);
  }

  async function handleSubmitReport() {
    if (!token || !product || !reportReason || reportSubmitting) return;
    if (reportReason === 'OTHER' && !reportDetails.trim()) {
      Alert.alert('Details required', 'Please describe the issue for this report.');
      return;
    }

    setReportSubmitting(true);
    try {
      await reportListing(token, product.id, {
        reason: reportReason,
        details: reportDetails,
      });
      setReportVisible(false);
      setReportReason(null);
      setReportDetails('');
      Alert.alert('Report submitted', 'Thanks. Our team will review this listing.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  }

  async function handleSubmitInquiry() {
    if (!token || !product) return;

    setSubmitting(true);
    try {
      const result = await startInquiry(token, product.id, inquiryMessage || undefined);
      setInquiryVisible(false);
      setInquiryMessage('');
      router.push({
        pathname: '/messages/[id]',
        params: { id: result.conversationId },
      });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send inquiry');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <DetailHeader
          onBack={() => router.back()}
          saved={false}
          onToggleSave={() => {}}
          onReport={() => {}}
          shareTitle=""
          shareMessage=""
        />
        <ProductDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DetailHeader
          onBack={() => router.back()}
          saved={false}
          onToggleSave={() => {}}
          onReport={() => {}}
          shareTitle=""
          shareMessage=""
        />
        <View style={styles.centered}>
          <Text style={styles.error}>{error || 'Product not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const shareMessage = buildProductShareMessage(product);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <DetailHeader
        onBack={() => router.back()}
        saved={saved}
        onToggleSave={handleToggleSave}
        onReport={openReportModal}
        shareTitle={product.title}
        shareMessage={shareMessage}
      />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: STICKY_BAR_HEIGHT + insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ProductGallery images={product.images} title={product.title} />
        <ScreenContent>
          <View style={styles.content}>
            <ProductHero product={product} />
            <QuickStatsRow product={product} />
            <SellerTrustCard seller={product.seller} />
            <MarketRateCard product={product} range={marketRange} />
            <InquiryUrgency inquiryCount={inquiryCount} />
            <DescriptionOverview description={product.description} />
            <SpecsGrid attributes={product.attributes} />
            <WhyBuySection product={product} />
            <LocationSection location={product.location} />
            <SimilarListings products={similar} category={product.category} />
          </View>
        </ScreenContent>
      </ScrollView>

      <StickyActionBar
        product={product}
        submitting={submitting}
        onInquiry={() => openInquiryModal()}
      />

      <InquiryModal
        visible={inquiryVisible}
        title="Send Inquiry"
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
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  container: {
    paddingTop: 0,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
});
