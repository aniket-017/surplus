import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  ProductGallery,
  ProductHero,
  QuickStatsRow,
  SellerTrustCard,
  SimilarListings,
  SpecsGrid,
  StickyActionBar,
  WhyBuySection,
} from '@/src/components/buyer/product-detail';
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
import { formatListingPrice } from '@/src/lib/productFormat';
import { browseProducts, getBrowseProduct } from '@/src/lib/productsApi';
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
    if (!token || !product) return;

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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
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
          shareTitle=""
          shareMessage=""
        />
        <View style={styles.centered}>
          <Text style={styles.error}>{error || 'Product not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const shareMessage = `${product.title}\n${formatListingPrice(product)}\n${product.quantity} ${product.quantityUnit} available`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <DetailHeader
        onBack={() => router.back()}
        saved={saved}
        onToggleSave={handleToggleSave}
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
        saved={saved}
        saving={saving}
        submitting={submitting}
        onSave={handleToggleSave}
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
