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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { CategoryBrowseHeader } from '@/src/components/buyer/CategoryBrowseHeader';
import { ProductListingCard } from '@/src/components/buyer/ProductListingCard';
import { SubcategoryPickerSheet } from '@/src/components/buyer/SubcategoryPickerSheet';
import { SubcategoryRail } from '@/src/components/buyer/SubcategoryRail';
import { ScreenContent } from '@/src/components/ScreenContent';
import { useAuth } from '@/src/context/AuthContext';
import { productCardWidth } from '@/src/constants/layout';
import { colors, spacing } from '@/src/constants/theme';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { getSavedListings, toggleSavedListing } from '@/src/lib/conversationsApi';
import {
  browseProducts,
  getProductCategories,
  getProductSubCategories,
} from '@/src/lib/productsApi';
import type { ProductCategory, ProductListing, ProductSubCategory } from '@/src/types/product';

const HORIZONTAL_PADDING = spacing.lg;
const GRID_GAP = spacing.sm;

export default function CategoryBrowseScreen() {
  const params = useLocalSearchParams<{ name?: string | string[] }>();
  const categoryName = Array.isArray(params.name) ? params.name[0] : params.name;
  const decodedName = categoryName ? decodeURIComponent(categoryName) : '';

  if (!decodedName) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScreenContent style={styles.centered}>
          <Text style={styles.emptyTitle}>Category not found</Text>
          <Text style={styles.emptyText} onPress={() => router.back()}>
            Go back
          </Text>
        </ScreenContent>
      </SafeAreaView>
    );
  }

  return <CategoryBrowseContent key={decodedName} categoryName={decodedName} />;
}

function CategoryBrowseContent({ categoryName }: { categoryName: string }) {
  const { token } = useAuth();
  const { width, columns } = useBreakpoint();
  const cardWidth = productCardWidth(width, columns, HORIZONTAL_PADDING, GRID_GAP);

  const [categoryMeta, setCategoryMeta] = useState<ProductCategory | null>(null);
  const [subCategories, setSubCategories] = useState<ProductSubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [subQuery, setSubQuery] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const listingCount = useMemo(() => {
    if (selectedSubCategory) {
      const match = subCategories.find((item) => item.name === selectedSubCategory);
      return match?.count ?? products.length;
    }
    if (categoryMeta) return categoryMeta.count;
    return subCategories.reduce((sum, item) => sum + item.count, 0);
  }, [categoryMeta, products.length, selectedSubCategory, subCategories]);

  const loadMeta = useCallback(async () => {
    if (!token) {
      setLoadingSubs(false);
      return;
    }

    setLoadingSubs(true);
    try {
      const [categoriesData, subData] = await Promise.all([
        getProductCategories(token),
        getProductSubCategories(token, categoryName),
      ]);
      setCategoryMeta(
        categoriesData.categories.find((item) => item.name === categoryName) ?? null,
      );
      setSubCategories(subData.subCategories);
      setSelectedSubCategory((current) =>
        current && !subData.subCategories.some((item) => item.name === current) ? '' : current,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load category');
      setSubCategories([]);
    } finally {
      setLoadingSubs(false);
    }
  }, [token, categoryName]);

  const loadProducts = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const [productsData, savedData] = await Promise.all([
          browseProducts(token, {
            category: categoryName,
            subCategory: selectedSubCategory || undefined,
            limit: 40,
          }),
          getSavedListings(token).catch(() => ({ products: [] as ProductListing[] })),
        ]);
        setProducts(productsData.products);
        setSavedIds(new Set(savedData.products.map((item) => item.id)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings');
        setProducts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, categoryName, selectedSubCategory],
  );

  useFocusEffect(
    useCallback(() => {
      void loadMeta();
    }, [loadMeta]),
  );

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function handleRefresh() {
    await Promise.all([loadMeta(), loadProducts(true)]);
  }

  async function handleToggleSave(productId: string) {
    if (!token || togglingId) return;

    setTogglingId(productId);
    const wasSaved = savedIds.has(productId);

    setSavedIds((current) => {
      const next = new Set(current);
      if (wasSaved) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      const result = await toggleSavedListing(token, productId);
      setSavedIds((current) => {
        const next = new Set(current);
        if (result.saved) next.add(productId);
        else next.delete(productId);
        return next;
      });
    } catch (err) {
      setSavedIds((current) => {
        const next = new Set(current);
        if (wasSaved) next.add(productId);
        else next.delete(productId);
        return next;
      });
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update saved listing');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenContent style={styles.screenContent}>
        <View style={styles.stickyHeader}>
          <CategoryBrowseHeader
            categoryName={categoryName}
            imageUrl={categoryMeta?.imageUrl}
            listingCount={listingCount}
            subcategoryCount={subCategories.length}
            onBack={() => router.back()}
          />
          <SubcategoryRail
            subCategories={subCategories}
            selected={selectedSubCategory}
            query={subQuery}
            onQueryChange={setSubQuery}
            onSelect={setSelectedSubCategory}
            onSeeAll={() => setPickerVisible(true)}
            loading={loadingSubs}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.sectionLabel}>
            {selectedSubCategory ? selectedSubCategory : 'All listings'}
          </Text>
        </View>

        <FlatList
          key={`${columns}-${selectedSubCategory}`}
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
          contentContainerStyle={styles.listContent}
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
              <View style={styles.emptyState}>
                <ActivityIndicator color={colors.accent} size="large" />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No listings found</Text>
                <Text style={styles.emptyText}>
                  {selectedSubCategory
                    ? 'Try another subcategory or clear the selection.'
                    : 'There are no active listings in this category yet.'}
                </Text>
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </ScreenContent>

      <SubcategoryPickerSheet
        visible={pickerVisible}
        subCategories={subCategories}
        selected={selectedSubCategory}
        onClose={() => setPickerVisible(false)}
        onSelect={setSelectedSubCategory}
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
  stickyHeader: {
    gap: spacing.md,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bgSubtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sectionLabel: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: GRID_GAP,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
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
