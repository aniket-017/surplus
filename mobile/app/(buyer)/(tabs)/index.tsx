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

import { BuyerHomeHeader } from '@/src/components/buyer/BuyerHomeHeader';
import { BuyerSearchBar } from '@/src/components/buyer/BuyerSearchBar';
import { CategoryCarousel } from '@/src/components/buyer/CategoryCarousel';
import {
  countActiveFilters,
  EMPTY_BROWSE_FILTERS,
  FilterModal,
  type BrowseFilters,
} from '@/src/components/buyer/FilterModal';
import { ListingFilterChips } from '@/src/components/buyer/ListingFilterChips';
import { ProductListingCard } from '@/src/components/buyer/ProductListingCard';
import { useAuth } from '@/src/context/AuthContext';
import { useBuyerLocation } from '@/src/context/LocationContext';
import { colors, spacing } from '@/src/constants/theme';
import { browseProducts, getProductCategories } from '@/src/lib/productsApi';
import { loadCategoryImageManifest } from '@/src/lib/categoryImages';
import type { BrowseSort, ProductCategory, ProductListing } from '@/src/types/product';

const HORIZONTAL_PADDING = spacing.lg;
const GRID_GAP = spacing.sm;
const CARD_WIDTH =
  (Dimensions.get('window').width - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;

function parseOptionalPrice(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function chipIdFromFilters(filters: BrowseFilters): string {
  if (filters.nearMe) return 'near';
  if (filters.sort === 'price_asc') return 'price';
  if (filters.sort === 'recent') return 'all';
  return 'recent';
}

export default function BuyerHomeTab() {
  const { token, user } = useAuth();
  const { location } = useBuyerLocation();
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<BrowseFilters>(EMPTY_BROWSE_FILTERS);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const activeCategory = filters.category;
  const activeFilter = chipIdFromFilters(filters);
  const activeFilterCount = countActiveFilters(filters);

  useEffect(() => {
    if (typeof categoryParam === 'string' && categoryParam.length > 0) {
      setFilters((prev) => ({ ...prev, category: categoryParam }));
    }
  }, [categoryParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const nearMeCity = location?.city || user?.address?.city || '';

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
            category: filters.category || undefined,
            sort: filters.sort,
            city: filters.nearMe && nearMeCity ? nearMeCity : undefined,
            minPrice: parseOptionalPrice(filters.minPrice),
            maxPrice: parseOptionalPrice(filters.maxPrice),
            condition: filters.condition || undefined,
            negotiable: filters.negotiable || undefined,
            limit: 40,
          }),
        ]);

        setCategories(categoriesData.categories);
        setProducts(productsData.products);

        if (filters.nearMe && !nearMeCity) {
          setError('Tap the location at the top to choose where "Near Me" should look.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings');
        setProducts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, debouncedSearch, filters, nearMeCity],
  );

  useFocusEffect(
    useCallback(() => {
      loadCategoryImageManifest(true);
      loadFeed();
    }, [loadFeed]),
  );

  function handleCategorySelect(category: string) {
    setFilters((prev) => ({ ...prev, category }));
  }

  function handleFilterChange(filterId: string, nextSort: BrowseSort) {
    setFilters((prev) => ({
      ...prev,
      sort: nextSort,
      nearMe: filterId === 'near',
    }));
  }

  function handleApplyFilters(next: BrowseFilters) {
    setFilters(next);
  }

  const listHeader = useMemo(
    () => (
      <View style={styles.headerContent}>
        <BuyerHomeHeader />
        <BuyerSearchBar
          value={search}
          onChangeText={setSearch}
          onFilterPress={() => setFiltersVisible(true)}
          activeFilterCount={activeFilterCount}
        />
        <CategoryCarousel
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={handleCategorySelect}
        />
        <ListingFilterChips activeFilter={activeFilter} onChangeFilter={handleFilterChange} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    ),
    [search, categories, activeCategory, activeFilter, activeFilterCount, error],
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

      <FilterModal
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        filters={filters}
        categories={categories}
        nearMeCity={nearMeCity}
        onApply={handleApplyFilters}
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
