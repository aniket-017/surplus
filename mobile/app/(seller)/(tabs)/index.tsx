import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenContent } from '@/src/components/ScreenContent';
import {
  SellerActivityCard,
  SellerBuyBanner,
  SellerHomeHero,
  SellerMyListingsRail,
  SellerMyServicesRail,
  SellerSellBanner,
  SellerServiceBanner,
} from '@/src/components/seller';
import { useAdminNotificationUnreadCount } from '@/src/context/AdminNotificationsContext';
import { useAuth } from '@/src/context/AuthContext';
import { useRoleSwitch } from '@/src/context/RoleSwitchContext';
import { useMyProducts } from '@/src/hooks/useMyProducts';
import { useMyServices } from '@/src/hooks/useMyServices';
import { colors, spacing } from '@/src/constants/theme';
import { getSellerEstimatedValue } from '@/src/lib/productFormat';

const HORIZONTAL_PADDING = 20;

export default function SellerDashboardTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { switchRole, switching: roleSwitching } = useRoleSwitch();
  const { products, stats, loading, reload } = useMyProducts();
  const {
    services,
    loading: servicesLoading,
    reload: reloadServices,
  } = useMyServices();
  const unreadCount = useAdminNotificationUnreadCount();
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const estimatedValue = useMemo(() => getSellerEstimatedValue(products), [products]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([reload(), reloadServices()]);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSwitchToBuyer() {
    if (switching || roleSwitching) return;

    setSwitching(true);
    setSwitchError('');

    try {
      await switchRole('buyer');
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : 'Failed to switch to buyer');
    } finally {
      setSwitching(false);
    }
  }

  function openListings() {
    router.push('/(seller)/(tabs)/listings');
  }

  function openAddProduct() {
    router.push('/(seller)/add-product');
  }

  function openAddService() {
    router.push('/(seller)/add-service');
  }

  function openServicesList() {
    router.push({ pathname: '/(seller)/(tabs)/listings', params: { tab: 'services' } });
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={insets.top}
          />
        }
      >
        <ScreenContent>
          <SellerHomeHero
            name={user?.name}
            city={user?.address?.city}
            activeListings={stats.activeListings}
            unreadCount={unreadCount}
            topInset={insets.top}
            horizontalPadding={HORIZONTAL_PADDING}
          />

          <View style={styles.body}>
            <SellerSellBanner onPress={openAddProduct} />

            <SellerServiceBanner onPress={openAddService} />

            <SellerBuyBanner
              onPress={() => void handleSwitchToBuyer()}
              loading={switching || roleSwitching}
            />
            {switchError ? <Text style={styles.switchError}>{switchError}</Text> : null}

            <SellerActivityCard
              activeListings={stats.activeListings}
              views={stats.totalViews}
              inquiries={stats.totalInquiries}
              estimatedValue={estimatedValue}
              onViewStats={openListings}
            />

            <SellerMyListingsRail
              products={products}
              loading={loading}
              onSeeAll={openListings}
              onAddProduct={openAddProduct}
              onOpenProduct={(id) =>
                router.push({ pathname: '/(seller)/products/[id]', params: { id } })
              }
            />

            <SellerMyServicesRail
              services={services}
              loading={servicesLoading}
              onSeeAll={openServicesList}
              onAddService={openAddService}
              onOpenService={(id) =>
                router.push({ pathname: '/(seller)/services/[id]', params: { id } })
              }
            />
          </View>
        </ScreenContent>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
  },
  container: {
    paddingBottom: spacing.xl,
  },
  body: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: spacing.md,
  },
  switchError: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
});
