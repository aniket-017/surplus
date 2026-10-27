import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ServiceListingCard } from '@/src/components/buyer/ServiceListingCard';
import { ServicesFeedHeader } from '@/src/components/buyer/ServicesFeedHeader';
import { ScreenContent } from '@/src/components/ScreenContent';
import { productCardWidth } from '@/src/constants/layout';
import { colors, fonts, spacing } from '@/src/constants/theme';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useServicesFeed } from '@/src/hooks/useServicesFeed';

const HORIZONTAL_PADDING = 20;
const GRID_GAP = spacing.sm;

export default function BuyerServicesScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const { width, columns } = useBreakpoint();
  const cardWidth = productCardWidth(width, columns, HORIZONTAL_PADDING, GRID_GAP);
  const feed = useServicesFeed({ initialCategory: params.category ?? '' });
  const { setCategory } = feed;

  useEffect(() => {
    if (params.category !== undefined) setCategory(params.category);
  }, [params.category, setCategory]);

  function openService(serviceId: string) {
    router.push({ pathname: '/(buyer)/services/[id]', params: { id: serviceId } });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(buyer)/(tabs)'))}
          hitSlop={8}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
        </Pressable>
        <View style={styles.topBarCopy}>
          <Text style={styles.topBarTitle}>Services & Job Work</Text>
          <Text style={styles.topBarSubtitle}>Find workshops for your next job</Text>
        </View>
      </View>

      <ScreenContent style={styles.flex}>
        <FlatList
          key={columns}
          data={feed.services}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerBody}>
              <ServicesFeedHeader feed={feed} horizontalPadding={HORIZONTAL_PADDING} />
            </View>
          }
          renderItem={({ item }) => {
            const card = (
              <ServiceListingCard
                service={item}
                width={cardWidth}
                saved={feed.savedIds.has(item.id)}
                onToggleSave={() => void feed.toggleSave(item.id)}
                onPress={() => openService(item.id)}
              />
            );
            return columns === 1 ? <View style={styles.singleColumnItem}>{card}</View> : card;
          }}
          ListEmptyComponent={
            feed.loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="construct-outline" size={28} color={colors.muted} />
                <Text style={styles.emptyTitle}>No services found</Text>
                <Text style={styles.emptyText}>
                  Try another category or search term to find job work providers.
                </Text>
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={feed.refreshing}
              onRefresh={() => void feed.load(true)}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </ScreenContent>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCopy: {
    flex: 1,
  },
  topBarTitle: {
    color: colors.textStrong,
    fontSize: 20,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.4,
  },
  topBarSubtitle: {
    color: colors.muted,
    fontSize: 12.5,
    fontFamily: fonts.medium,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  headerBody: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: GRID_GAP,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  singleColumnItem: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  loading: {
    paddingVertical: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: HORIZONTAL_PADDING,
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
});
