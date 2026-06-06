import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DashboardScreen, DashboardShell } from '@/src/components/DashboardShell';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import { getImageUrl, getMyProducts } from '@/src/lib/productsApi';
import type { Product } from '@/src/types/product';

function formatPrice(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatCondition(condition: string) {
  return condition.charAt(0).toUpperCase() + condition.slice(1);
}

export default function SellerListingsTab() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const loadProducts = useCallback(async () => {
    if (!token) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }

    try {
      const data = await getMyProducts(token);
      setProducts(data.products);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts]),
  );

  return (
    <DashboardScreen>
      <DashboardShell
        role="seller"
        title="Seller Dashboard"
        subtitle="Manage your surplus listings and track listing performance."
        stats={[
          { label: 'Active Listings', value: String(products.length) },
          { label: 'Views', value: '0' },
        ]}
      >
        <View style={styles.content}>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push('/(seller)/add-product')}
          >
            <Text style={styles.addButtonText}>Add Product</Text>
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My listings</Text>
            <Text style={styles.sectionCount}>{products.length} total</Text>
          </View>

          {loadingProducts ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No listings yet</Text>
              <Text style={styles.emptyText}>
                Add your first surplus item to start reaching buyers on Surplus.
              </Text>
            </View>
          ) : (
            products.map((product) => (
              <Pressable
                key={product.id}
                style={styles.productCard}
                onPress={() =>
                  router.push({
                    pathname: '/(seller)/products/[id]',
                    params: { id: product.id },
                  })
                }
              >
                {product.images[0] ? (
                  <Image
                    source={{ uri: getImageUrl(product.images[0]) }}
                    style={styles.productImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.productImage, styles.productImageFallback]} />
                )}
                <View style={styles.productInfo}>
                  <View style={styles.productTopRow}>
                    <Text style={styles.productTitle} numberOfLines={2}>
                      {product.title}
                    </Text>
                    <View style={styles.conditionChip}>
                      <Text style={styles.conditionChipText}>
                        {formatCondition(product.condition)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.productMeta} numberOfLines={1}>
                    {product.category} / {product.subCategory}
                  </Text>
                  <Text style={styles.productPrice}>
                    {formatPrice(product.price)} · {product.quantity} {product.quantityUnit}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </DashboardShell>
    </DashboardScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionCount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  loadingWrap: {
    paddingVertical: spacing.lg,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  productCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    width: 84,
    height: 84,
    borderRadius: 10,
  },
  productImageFallback: {
    backgroundColor: colors.surfaceMuted,
  },
  productInfo: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  productTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  productTitle: {
    flex: 1,
    color: colors.textStrong,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 20,
  },
  conditionChip: {
    backgroundColor: colors.bgSubtle,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  conditionChipText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  productMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  productPrice: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
});
