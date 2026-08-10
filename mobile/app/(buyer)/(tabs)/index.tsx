import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { HomeListingsSkeleton } from '@/src/components/buyer/HomeListingsSkeleton';
import { ListingFilterChips } from '@/src/components/buyer/ListingFilterChips';
import { ProductListingCard } from '@/src/components/buyer/ProductListingCard';
import { SellSurplusCta } from '@/src/components/buyer/SellSurplusCta';
import { ScreenContent } from '@/src/components/ScreenContent';
import { useAuth } from '@/src/context/AuthContext';
import { useBuyerLocation } from '@/src/context/LocationContext';
import { useRoleSwitch } from '@/src/context/RoleSwitchContext';
import { productCardWidth } from '@/src/constants/layout';
import { colors, spacing } from '@/src/constants/theme';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { getSavedListings, toggleSavedListing } from '@/src/lib/conversationsApi';
import { browseProducts, getProductCategories } from '@/src/lib/productsApi';
import type { BrowseSort, ProductCategory, ProductListing } from '@/src/types/product';

const HORIZONTAL_PADDING = spacing.lg;
const GRID_GAP = spacing.sm;

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
  const { switchRole, switching: roleSwitching } = useRoleSwitch();
  const { location } = useBuyerLocation();
  const { width, columns } = useBreakpoint();
  const cardWidth = productCardWidth(width, columns, HORIZONTAL_PADDING, GRID_GAP);
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<BrowseFilters>(EMPTY_BROWSE_FILTERS);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [switchingToSell, setSwitchingToSell] = useState(false);

  const activeCategory = filters.category;
  const activeFilter = chipIdFromFilters(filters);
  const activeFilterCount = countActiveFilters(filters);

  useEffect(() => {
    if (typeof categoryParam === 'string' && categoryParam.length > 0) {
      setFilters((prev) => ({ ...prev, category: categoryParam, subCategory: '' }));
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
        const [categoriesData, productsData, savedData] = await Promise.all([
          getProductCategories(token),
          browseProducts(token, {
            search: debouncedSearch || undefined,
            category: filters.category || undefined,
            subCategory: filters.subCategory || undefined,
            sort: filters.sort,
            city: filters.nearMe && nearMeCity ? nearMeCity : undefined,
            minPrice: parseOptionalPrice(filters.minPrice),
            maxPrice: parseOptionalPrice(filters.maxPrice),
            condition: filters.condition || undefined,
            negotiable: filters.negotiable || undefined,
            limit: 40,
          }),
          getSavedListings(token).catch(() => ({ products: [] as ProductListing[] })),
        ]);

        setCategories(categoriesData.categories);
        setProducts(productsData.products);
        setSavedIds(new Set(savedData.products.map((item) => item.id)));

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

  async function handleToggleSave(productId: string) {
    if (!token || togglingId) return;

    setTogglingId(productId);
    const wasSaved = savedIds.has(productId);

    // Optimistic UI so the bookmark fills immediately.
    setSavedIds((current) => {
      const next = new Set(current);
      if (wasSaved) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });

    try {
      const result = await toggleSavedListing(token, productId);
      setSavedIds((current) => {
        const next = new Set(current);
        if (result.saved) {
          next.add(productId);
        } else {
          next.delete(productId);
        }
        return next;
      });
    } catch (err) {
      setSavedIds((current) => {
        const next = new Set(current);
        if (wasSaved) {
          next.add(productId);
        } else {
          next.delete(productId);
        }
        return next;
      });
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update saved listing');
    } finally {
      setTogglingId(null);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed]),
  );

  function handleCategorySelect(category: string) {
    setFilters((prev) => ({
      ...prev,
      category,
      subCategory: category === prev.category ? prev.subCategory : '',
    }));
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

  async function handleSellSurplus() {
    if (switchingToSell || roleSwitching) return;

    setSwitchingToSell(true);
    try {
      await switchRole('seller');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to switch to seller');
      setSwitchingToSell(false);
    }
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
        <SellSurplusCta onPress={() => void handleSellSurplus()} loading={switchingToSell || roleSwitching} />
        <CategoryCarousel
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={handleCategorySelect}
          loading={loading}
        />
        <ListingFilterChips activeFilter={activeFilter} onChangeFilter={handleFilterChange} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    ),
    [
      search,
      categories,
      activeCategory,
      activeFilter,
      activeFilterCount,
      error,
      switchingToSell,
      roleSwitching,
      loading,
    ],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenContent style={styles.screenContent}>
        <FlatList
          key={columns}
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <ProductListingCard
              product={item}
              width={cardWidth}
              saved={savedIds.has(item.id)}
              onToggleSave={() => void handleToggleSave(item.id)}
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
              <HomeListingsSkeleton columns={columns} cardWidth={cardWidth} />
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
      </ScreenContent>

      <FilterModal
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        filters={filters}
        categories={categories}
        nearMeCity={nearMeCity}
        token={token}
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
  screenContent: {
    flex: 1,
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
