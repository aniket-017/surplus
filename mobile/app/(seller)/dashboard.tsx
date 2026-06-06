import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardShell } from '@/src/components/DashboardShell';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import { getImageUrl, getMyProducts } from '@/src/lib/productsApi';
import type { Product } from '@/src/types/product';

export default function SellerDashboardScreen() {
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
    <DashboardShell
      role="seller"
      title="Seller Dashboard"
      subtitle="Manage your surplus listings, track inquiries, and grow your sales."
      stats={[
        { label: 'Active Listings', value: String(products.length) },
        { label: 'Inquiries', value: '0' },
        { label: 'Views', value: '0' },
        { label: 'Revenue', value: '₹0' },
      ]}
      footer={
        <View style={styles.footer}>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push('/(seller)/add-product')}
          >
            <Text style={styles.addButtonText}>Add Product</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>My listings</Text>

          {loadingProducts ? (
            <ActivityIndicator color={colors.accent} />
          ) : products.length === 0 ? (
            <Text style={styles.emptyText}>No products listed yet. Add your first surplus item.</Text>
          ) : (
            products.map((product) => (
              <Pressable
                key={product.id}
                style={styles.productCard}
                onPress={() =>
                  router.push({
                    pathname: '/(seller)/products/[id]',
                    params: {
                      id: product.id,
                      title: product.title,
                      category: `${product.category} / ${product.subCategory}`,
                      price: String(product.price),
                      image: product.images[0] || '',
                    },
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
                  <Text style={styles.productTitle}>{product.title}</Text>
                  <Text style={styles.productMeta}>
                    {product.category} / {product.subCategory}
                  </Text>
                  <Text style={styles.productPrice}>
                    ₹{product.price} · {product.quantity} {product.quantityUnit}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: spacing.md,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: 18,
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
    borderRadius: 10,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  productImageFallback: {
    backgroundColor: colors.surfaceMuted,
  },
  productInfo: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  productTitle: {
    color: colors.textStrong,
    fontWeight: '700',
    fontSize: 15,
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
