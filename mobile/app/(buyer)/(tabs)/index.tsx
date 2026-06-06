import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { BuyerHeroBanner } from '@/src/components/buyer/BuyerHeroBanner';
import { BuyerHomeHeader } from '@/src/components/buyer/BuyerHomeHeader';
import { BuyerSearchBar } from '@/src/components/buyer/BuyerSearchBar';
import { CategoryCarousel } from '@/src/components/buyer/CategoryCarousel';
import { ListingFilterChips } from '@/src/components/buyer/ListingFilterChips';
import { ProductListingCard } from '@/src/components/buyer/ProductListingCard';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import { browseProducts, getProductCategories } from '@/src/lib/productsApi';
import type { BrowseSort, ProductCategory, ProductListing } from '@/src/types/product';

const HORIZONTAL_PADDING = spacing.lg;
const GRID_GAP = spacing.sm;
const CARD_WIDTH =
  (Dimensions.get('window').width - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;

export default function BuyerHomeTab() {
  const { token } = useAuth();
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sort, setSort] = useState<BrowseSort>('recent');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof categoryParam === 'string' && categoryParam.length > 0) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const loadFeed = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const [categoriesData, productsData] = await Promise.all([
          getProductCategories(token),
          browseProducts(token, {
            search: debouncedSearch || undefined,
            category: activeCategory || undefined,
            sort,
            limit: 40,
          }),
        ]);

        setCategories(categoriesData.categories);
        setProducts(productsData.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings');
        setProducts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, debouncedSearch, activeCategory, sort],
  );

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed]),
  );

  function handleCategorySelect(category: string) {
    setActiveCategory(category);
  }

  function handleFilterChange(filterId: string, nextSort: BrowseSort) {
    setActiveFilter(filterId);
    setSort(nextSort);
  }

  const listHeader = useMemo(
    () => (
      <View style={styles.headerContent}>
        <BuyerHomeHeader />
        <BuyerSearchBar value={search} onChangeText={setSearch} />
        <BuyerHeroBanner />
        <CategoryCarousel
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={handleCategorySelect}
        />
        <ListingFilterChips activeFilter={activeFilter} onChangeFilter={handleFilterChange} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    ),
    [search, categories, activeCategory, activeFilter, error],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <ProductListingCard
            product={item}
            width={CARD_WIDTH}
            onPress={() =>
              router.push({
                pathname: '/products/[id]',
                params: { id: item.id },
              })
            }
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.accent} size="large" />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No listings found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your search or filters to discover more surplus materials.
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFeed(true)}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: spacing.xl,
  },
  headerContent: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: GRID_GAP,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
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
    textAlign: 'center',
    maxWidth: 280,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
});
