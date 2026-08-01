import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ProductListingCard } from '@/src/components/buyer/ProductListingCard';
import { ScreenContent } from '@/src/components/ScreenContent';
import { useAuth } from '@/src/context/AuthContext';
import { productCardWidth } from '@/src/constants/layout';
import { colors, spacing } from '@/src/constants/theme';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { getSavedListings, toggleSavedListing } from '@/src/lib/conversationsApi';
import type { ProductListing } from '@/src/types/product';

const HORIZONTAL_PADDING = spacing.lg;
const GRID_GAP = spacing.sm;

export default function SavedListingsScreen() {
  const { token } = useAuth();
  const { width, columns } = useBreakpoint();
  const cardWidth = productCardWidth(width, columns, HORIZONTAL_PADDING, GRID_GAP);
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadSaved = useCallback(
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
        const data = await getSavedListings(token);
        setProducts(data.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load saved listings');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadSaved();
    }, [loadSaved]),
  );

  async function handleToggleSave(productId: string) {
    if (!token || togglingId) return;

    setTogglingId(productId);
    try {
      const result = await toggleSavedListing(token, productId);
      if (!result.saved) {
        setProducts((current) => current.filter((item) => item.id !== productId));
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update saved listing');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenContent style={styles.screenContent}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.accent} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Saved</Text>
          <View style={styles.headerSpacer} />
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <FlatList
          key={columns}
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ProductListingCard
              product={item}
              width={cardWidth}
              saved
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
                <View style={styles.emptyIcon}>
                  <Ionicons name="bookmark-outline" size={28} color={colors.accent} />
                </View>
                <Text style={styles.emptyTitle}>No saved listings yet</Text>
                <Text style={styles.emptyText}>
                  Tap the bookmark on any product to save it here for later.
                </Text>
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadSaved(true)}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 72,
  },
  backText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 16,
  },
  title: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: {
    minWidth: 72,
  },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: 'rgba(192, 57, 43, 0.08)',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: GRID_GAP,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.xs,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    color: colors.textStrong,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
});
