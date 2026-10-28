import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { BuyerHomeHero } from '@/src/components/buyer/BuyerHomeHero';
import { BuyerJobWorkBanner } from '@/src/components/buyer/BuyerJobWorkBanner';
import { BuyerSearchBar } from '@/src/components/buyer/BuyerSearchBar';
import { CategoryCarousel } from '@/src/components/buyer/CategoryCarousel';
import {
  countActiveFilters,
  EMPTY_BROWSE_FILTERS,
  FilterModal,
  type BrowseFilters,
} from '@/src/components/buyer/FilterModal';
import { HomeListingsSkeleton } from '@/src/components/buyer/HomeListingsSkeleton';
import { HomeModeSwitch, type HomeMode } from '@/src/components/buyer/HomeModeSwitch';
import { ListingFilterChips } from '@/src/components/buyer/ListingFilterChips';
import { ListingsMapView } from '@/src/components/buyer/ListingsMapView';
import { ProductListingCard } from '@/src/components/buyer/ProductListingCard';
import { ServiceListingCard } from '@/src/components/buyer/ServiceListingCard';
import { ServicesFeedHeader } from '@/src/components/buyer/ServicesFeedHeader';
import { ScreenContent } from '@/src/components/ScreenContent';
import { useAuth } from '@/src/context/AuthContext';
import { useBuyerLocation } from '@/src/context/LocationContext';
import { productCardWidth } from '@/src/constants/layout';
import { colors, fonts, spacing } from '@/src/constants/theme';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useServicesFeed } from '@/src/hooks/useServicesFeed';
import { getSavedListings, toggleSavedListing } from '@/src/lib/conversationsApi';
import { browseProducts, getProductCategories } from '@/src/lib/productsApi';
import type { BrowseSort, ProductCategory, ProductListing } from '@/src/types/product';
import type { ServiceListing } from '@/src/types/service';

type HomeListItem = ProductListing | ServiceListing;

const HORIZONTAL_PADDING = 20;
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
  return 'recent';
}

export default function BuyerHomeTab() {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { location } = useBuyerLocation();
  const { width, columns } = useBreakpoint();
  const cardWidth = productCardWidth(width, columns, HORIZONTAL_PADDING, GRID_GAP);
  const params = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<HomeMode>(params.mode === 'services' ? 'services' : 'products');
  const isServicesMode = mode === 'services';
  const servicesFeed = useServicesFeed({ enabled: isServicesMode });

  useEffect(() => {
    if (params.mode === 'services' || params.mode === 'products') {
      setMode(params.mode);
    }
  }, [params.mode]);

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
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const activeFilter = chipIdFromFilters(filters);
  const activeFilterCount = countActiveFilters(filters);

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
          setError('Tap the location at the top to choose where "Nearby" should look.');
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
      if (mode === 'products') loadFeed();
    }, [loadFeed, mode]),
  );

  function handleCategorySelect(category: string) {
    if (!category) {
      router.push('/(buyer)/(tabs)/categories');
      return;
    }

    router.push({
      pathname: '/category/[name]',
      params: { name: category },
    });
  }

  function handleFilterChange(filterId: string, nextSort: BrowseSort) {
    setViewMode('grid');
    setFilters((prev) => ({
      ...prev,
      sort: nextSort,
      nearMe: filterId === 'near',
    }));
  }

  function handleApplyFilters(next: BrowseFilters) {
    setFilters(next);
  }

  function openExplore() {
    router.push('/(buyer)/(tabs)/categories');
  }

  function openProduct(productId: string) {
    router.push({
      pathname: '/products/[id]',
      params: { id: productId },
    });
  }

  function openService(serviceId: string) {
    router.push({
      pathname: '/(buyer)/services/[id]',
      params: { id: serviceId },
    });
  }

  const mapFallbackCenter =
    typeof user?.address?.latitude === 'number' && typeof user?.address?.longitude === 'number'
      ? { latitude: user.address.latitude, longitude: user.address.longitude }
      : null;
  const isMapView = viewMode === 'map';

  const modeHeader = (
    <>
      <BuyerHomeHero topInset={insets.top} horizontalPadding={HORIZONTAL_PADDING} mode={mode} />
      <View style={styles.switchWrap}>
        <HomeModeSwitch mode={mode} onChange={setMode} />
      </View>
    </>
  );

  const productHeader = useMemo(
    () => (
      <View style={styles.headerBody}>
          <BuyerSearchBar
            value={search}
            onChangeText={setSearch}
            onFilterPress={() => setFiltersVisible(true)}
            activeFilterCount={activeFilterCount}
          />
          <CategoryCarousel
            categories={categories}
            onSelectCategory={handleCategorySelect}
            loading={loading}
            selectedCategory={filters.category || undefined}
          />
          <ListingFilterChips
            activeFilter={activeFilter}
            onChangeFilter={handleFilterChange}
            mapActive={isMapView}
            onToggleMap={() => setViewMode((current) => (current === 'map' ? 'grid' : 'map'))}
            onSeeAll={openExplore}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    ),
    [
      search,
      categories,
      activeFilter,
      isMapView,
      activeFilterCount,
      error,
      loading,
      filters.category,
    ],
  );

  const servicesHeader = (
    <View style={styles.headerBody}>
      <ServicesFeedHeader
        feed={servicesFeed}
        horizontalPadding={HORIZONTAL_PADDING}
        banner={<BuyerJobWorkBanner onPress={() => servicesFeed.setSortChip('nearby')} />}
      />
    </View>
  );

  const servicesEmpty = servicesFeed.loading ? (
    <View style={styles.emptyState}>
      <ActivityIndicator color={colors.accent} />
    </View>
  ) : (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="construct-outline" size={26} color="#EA580C" />
      </View>
      <Text style={styles.emptyTitle}>No services found</Text>
      <Text style={styles.emptyText}>
        Try another category or clear your search to find nearby workshops.
      </Text>
    </View>
  );

  // One list for both modes keeps the header (and the switch animation) mounted across switches.
  const listData: HomeListItem[] = isServicesMode
    ? servicesFeed.services
    : isMapView
      ? []
      : products;

  return (
    <View style={styles.screen}>
      <ScreenContent style={styles.screenContent}>
        <FlatList<HomeListItem>
          key={columns}
          data={listData}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              {modeHeader}
              {isServicesMode ? servicesHeader : productHeader}
            </View>
          }
          renderItem={({ item }) => {
            const card = isServicesMode ? (
              <ServiceListingCard
                service={item as ServiceListing}
                width={cardWidth}
                saved={servicesFeed.savedIds.has(item.id)}
                onToggleSave={() => void servicesFeed.toggleSave(item.id)}
                onPress={() => openService(item.id)}
              />
            ) : (
              <ProductListingCard
                product={item as ProductListing}
                width={cardWidth}
                saved={savedIds.has(item.id)}
                onToggleSave={() => void handleToggleSave(item.id)}
                onPress={() => openProduct(item.id)}
              />
            );

            if (columns === 1) {
              return <View style={styles.singleColumnItem}>{card}</View>;
            }

            return card;
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              {isServicesMode ? (
                servicesEmpty
              ) : isMapView ? (
                <ListingsMapView
                  products={products}
                  loading={loading}
                  fallbackCenter={mapFallbackCenter}
                  onOpenProduct={openProduct}
                />
              ) : loading ? (
                <HomeListingsSkeleton columns={columns} cardWidth={cardWidth} />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No listings found</Text>
                  <Text style={styles.emptyText}>
                    Try adjusting your search or filters to discover more surplus materials.
                  </Text>
                </View>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isServicesMode ? servicesFeed.refreshing : refreshing}
              onRefresh={() => (isServicesMode ? void servicesFeed.load(true) : loadFeed(true))}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressViewOffset={insets.top}
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
        onApply={handleApplyFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
  },
  screenContent: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  headerBody: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  switchWrap: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    marginBottom: spacing.xs,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: GRID_GAP,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  singleColumnItem: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  emptyWrap: {
    paddingHorizontal: HORIZONTAL_PADDING,
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
    fontFamily: fonts.extrabold,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.medium,
    textAlign: 'center',
    maxWidth: 280,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.medium,
  },
});
