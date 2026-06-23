import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DashboardScreen } from '@/src/components/DashboardShell';
import { SellerListingCard } from '@/src/components/seller';
import { useMyProducts } from '@/src/hooks/useMyProducts';
import { colors, spacing } from '@/src/constants/theme';

export default function SellerListingsTab() {
  const { products, loading } = useMyProducts();

  return (
    <DashboardScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>My Listings</Text>
          <Text style={styles.pageCount}>{products.length} total</Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/(seller)/add-product')}
        >
          <Text style={styles.addButtonText}>Add Product</Text>
        </Pressable>

        {loading ? (
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
          <View style={styles.list}>
            {products.map((product) => (
              <SellerListingCard
                key={product.id}
                product={product}
                onPress={() =>
                  router.push({
                    pathname: '/(seller)/products/[id]',
                    params: { id: product.id },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </DashboardScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  pageTitle: {
    color: colors.textStrong,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageCount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
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
  loadingWrap: {
    paddingVertical: spacing.lg,
  },
  list: {
    gap: spacing.sm,
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
});
