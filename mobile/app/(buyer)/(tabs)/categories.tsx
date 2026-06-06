import { router } from 'expo-router';
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
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import { getCategoryIcon } from '@/src/lib/productFormat';
import { getProductCategories } from '@/src/lib/productsApi';
import type { ProductCategory } from '@/src/types/product';

export default function BuyerCategoriesTab() {
  const { token } = useAuth();
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
          <Pressable style={styles.retryButton} onPress={loadCategories}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No categories yet. Check back when listings are available.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {categories.map((category) => (
            <Pressable
              key={category.name}
              style={styles.tile}
              onPress={() => handleSelectCategory(category.name)}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  name={getCategoryIcon(category.name) as keyof typeof Ionicons.glyphMap}
                  size={28}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.tileLabel} numberOfLines={2}>
                {category.name}
              </Text>
              <Text style={styles.tileCount}>{category.count} listings</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  tile: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  tileCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: colors.navy,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
