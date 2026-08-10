import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import {
  BuyerCategoryCard,
  CATEGORY_GRID_GAP,
  CATEGORY_GRID_PADDING,
  getCategoryTileWidth,
} from '@/src/components/buyer/BuyerCategoryCard';
import { ScreenContent } from '@/src/components/ScreenContent';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { getProductCategories } from '@/src/lib/productsApi';
import type { ProductCategory } from '@/src/types/product';

export default function BuyerCategoriesTab() {
  const { token } = useAuth();
  const { width, categoryColumns, contentMaxWidth } = useBreakpoint();
  const layoutWidth = Math.min(width, contentMaxWidth);
  const tileWidth = getCategoryTileWidth(layoutWidth, categoryColumns);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await getProductCategories(token);
      setCategories(data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories]),
  );

  function handleSelectCategory(category: string) {
    router.push({
      pathname: '/(buyer)/(tabs)',
      params: { category },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenContent style={styles.screenContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Categories</Text>
          <Text style={styles.subtitle}>Browse surplus materials by category</Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.error}>{error}</Text>
            <Text style={styles.retryLink} onPress={loadCategories}>
              Try again
            </Text>
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No categories yet. Check back when listings are available.</Text>
          </View>
        ) : (
          <FlatList
            key={categoryColumns}
            data={categories}
            keyExtractor={(item) => item.name}
            numColumns={categoryColumns}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <BuyerCategoryCard
                name={item.name}
                icon={item.icon}
                imageUrl={item.imageUrl}
                count={item.count}
                tileWidth={tileWidth}
                onPress={() => handleSelectCategory(item.name)}
              />
            )}
          />
        )}
      </ScreenContent>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 4,
  },
  title: {
    color: colors.textStrong,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  list: {
    paddingHorizontal: CATEGORY_GRID_PADDING,
    paddingBottom: spacing.xl,
  },
  columnWrapper: {
    gap: CATEGORY_GRID_GAP,
    marginBottom: CATEGORY_GRID_GAP,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  retryLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
