import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DashboardScreen } from '@/src/components/DashboardShell';
import {
  SellerAddProductCard,
  SellerListingCard,
  SellerListingsHeader,
  SellerListingStatusTabs,
  filterSellerListings,
  getSellerListingCounts,
  type SellerListingFilter,
} from '@/src/components/seller';
import { useMyProducts } from '@/src/hooks/useMyProducts';
import { colors, spacing } from '@/src/constants/theme';

export default function SellerListingsTab() {
  const { products, loading } = useMyProducts();
  const [activeFilter, setActiveFilter] = useState<SellerListingFilter>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const counts = useMemo(() => getSellerListingCounts(products), [products]);
  const filteredProducts = useMemo(
    () => filterSellerListings(products, activeFilter, searchQuery),
    [products, activeFilter, searchQuery],
  );

  function openProduct(productId: string) {
    router.push({
      pathname: '/(seller)/products/[id]',
      params: { id: productId },
    });
  }

  function openEdit(productId: string) {
    router.push({
      pathname: '/(seller)/edit-product/[id]',
      params: { id: productId },
    });
  }

  return (
    <DashboardScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <SellerListingsHeader
          totalCount={products.length}
          onSearchPress={() => setSearchOpen((value) => !value)}
        />

        {searchOpen ? (
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={colors.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search listings..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              autoFocus
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <SellerAddProductCard onPress={() => router.push('/(seller)/add-product')} />

        <SellerListingStatusTabs
          activeFilter={activeFilter}
          counts={counts}
          onChange={setActiveFilter}
        />

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {products.length === 0 ? 'No listings yet' : 'No matching listings'}
            </Text>
            <Text style={styles.emptyText}>
              {products.length === 0
                ? 'Add your first surplus item to start reaching buyers on Surplus.'
                : 'Try a different filter or search term to find your listings.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredProducts.map((product) => (
              <SellerListingCard
                key={product.id}
                product={product}
                onPress={() => openProduct(product.id)}
                onEdit={() => openEdit(product.id)}
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 15,
    paddingVertical: 0,
  },
  loadingWrap: {
    paddingVertical: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
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
