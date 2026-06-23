import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import { getImageUrl, getProduct } from '@/src/lib/productsApi';
import {
  CONDITION_OPTIONS,
  PRICE_TYPE_OPTIONS,
  type Product,
  type ProductCondition,
  type PriceType,
} from '@/src/types/product';

const IMAGE_WIDTH = Dimensions.get('window').width - spacing.lg * 2;

function formatPrice(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getPriceTypeLabel(priceType: PriceType) {
  return PRICE_TYPE_OPTIONS.find((option) => option.value === priceType)?.label ?? formatLabel(priceType);
}

function getConditionLabel(condition: ProductCondition) {
  return CONDITION_OPTIONS.find((option) => option.value === condition)?.label ?? formatLabel(condition);
}

function formatAttributeKey(key: string) {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!token || !id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError('');

      try {
        const data = await getProduct(token, id);
        if (!cancelled) {
          setProduct(data.product);
          setActiveImage(0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load product');
          setProduct(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [token, id]);

  function handleImageScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / IMAGE_WIDTH);
    setActiveImage(index);
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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={styles.error}>{error || 'Product not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const locationPrimary = product.location.address
    ? product.location.address
    : `${product.location.city}, ${product.location.state} — ${product.location.pincode}`;

  const locationSecondary = product.location.address
    ? `${product.location.city}, ${product.location.state} — ${product.location.pincode}`
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Listing details</Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(seller)/edit-product/[id]',
              params: { id: product.id },
            })
          }
          hitSlop={8}
        >
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.galleryCard}>
          {product.images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleImageScroll}
                scrollEventThrottle={16}
              >
                {product.images.map((image, index) => (
                  <Image
                    key={`${image}-${index}`}
                    source={{ uri: getImageUrl(image) }}
                    style={styles.heroImage}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
              {product.images.length > 1 ? (
                <View style={styles.dotsRow}>
                  {product.images.map((_, index) => (
                    <View
                      key={`dot-${index}`}
                      style={[styles.dot, index === activeImage && styles.dotActive]}
                    />
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.imageFallback}>
              <Text style={styles.imageFallbackText}>No image</Text>
            </View>
          )}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{product.category}</Text>
            </View>
            <View style={[styles.chip, styles.chipMuted]}>
              <Text style={styles.chipTextMuted}>{product.subCategory}</Text>
            </View>
          </View>

          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <View style={styles.priceTypeBadge}>
              <Text style={styles.priceTypeText}>{getPriceTypeLabel(product.priceType)}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Condition</Text>
              <Text style={styles.statValue}>{getConditionLabel(product.condition)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Available</Text>
              <Text style={styles.statValue}>
                {product.quantity} {product.quantityUnit}
              </Text>
            </View>
          </View>
        </View>

        <SectionCard title="Description" subtitle="Product overview">
          <Text style={styles.bodyText}>{product.description}</Text>
        </SectionCard>

        <SectionCard
          title="Specifications"
          subtitle={
            product.attributes.length
              ? `${product.attributes.length} material-specific properties`
              : 'No specifications listed'
          }
        >
          {product.attributes.length === 0 ? (
            <Text style={styles.emptyText}>No attributes were added for this listing.</Text>
          ) : (
            product.attributes.map((attribute, index) => (
              <View
                key={`${attribute.key}-${index}`}
                style={[
                  styles.attributeRow,
                  index < product.attributes.length - 1 && styles.attributeRowBorder,
                ]}
              >
                <View style={styles.attributeBadge}>
                  <Text style={styles.attributeBadgeText}>{index + 1}</Text>
                </View>
                <View style={styles.attributeContent}>
                  <Text style={styles.attributeKey}>{formatAttributeKey(attribute.key)}</Text>
                  <Text style={styles.attributeValue}>{attribute.value}</Text>
                </View>
              </View>
            ))
          )}
        </SectionCard>

        <SectionCard title="Location" subtitle="Pickup availability">
          <View style={styles.locationBlock}>
            <Text style={styles.locationPrimary}>{locationPrimary}</Text>
            {locationSecondary ? (
              <Text style={styles.locationSecondary}>{locationSecondary}</Text>
            ) : null}
          </View>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  headerTitle: {
    color: colors.textStrong,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 40,
  },
  editText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  container: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  galleryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  heroImage: {
    width: IMAGE_WIDTH,
    height: 260,
  },
  imageFallback: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  imageFallbackText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 18,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  chipMuted: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  chipText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextMuted: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: colors.textStrong,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 4,
  },
  price: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  priceTypeBadge: {
    backgroundColor: colors.bgSubtle,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceTypeText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flex: 1,
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeader: {
    gap: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  bodyText: {
    color: colors.textStrong,
    fontSize: 15,
    lineHeight: 24,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  attributeRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  attributeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  attributeBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  attributeContent: {
    flex: 1,
    gap: 2,
  },
  attributeKey: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  attributeValue: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  locationBlock: {
    gap: 6,
  },
  locationPrimary: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  locationSecondary: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
});
