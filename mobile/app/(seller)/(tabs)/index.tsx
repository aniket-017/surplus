import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DashboardScreen } from '@/src/components/DashboardShell';
import { Logo } from '@/src/components/Logo';
import { ScreenContent } from '@/src/components/ScreenContent';
import {
  SellerAddProductCard,
  SellerDashboardStats,
  SellerSwitchToBuyerCard,
  SellerWelcomeBanner,
} from '@/src/components/seller';
import { useAdminNotificationUnreadCount } from '@/src/context/AdminNotificationsContext';
import { useAuth } from '@/src/context/AuthContext';
import { useRoleSwitch } from '@/src/context/RoleSwitchContext';
import { useMyProducts } from '@/src/hooks/useMyProducts';
import { colors, spacing } from '@/src/constants/theme';
import { getSellerEstimatedValue } from '@/src/lib/productFormat';

export default function SellerDashboardTab() {
  const { user } = useAuth();
  const { switchRole, switching: roleSwitching } = useRoleSwitch();
  const { products, stats } = useMyProducts();
  const unreadCount = useAdminNotificationUnreadCount();
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState('');

  const estimatedValue = useMemo(() => getSellerEstimatedValue(products), [products]);

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

  return (
    <DashboardScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenContent style={styles.screenContent}>
          <View style={styles.header}>
            <Logo size="sm" />
            <Pressable
              style={styles.bellButton}
              onPress={() => router.push('/(seller)/notifications')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={20} color={colors.textStrong} />
              {unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : String(unreadCount)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          <SellerWelcomeBanner name={user?.name} />

          <SellerDashboardStats
            activeListings={stats.activeListings}
            views={stats.totalViews}
            inquiries={stats.totalInquiries}
            estimatedValue={estimatedValue}
          />

          <View style={styles.actions}>
            <SellerAddProductCard onPress={() => router.push('/(seller)/add-product')} />

            <Pressable
              style={styles.secondaryAction}
              onPress={() => router.push('/(seller)/(tabs)/listings')}
            >
              <Ionicons name="list" size={20} color={colors.accent} />
              <Text style={styles.secondaryActionText}>View All Listings</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          </View>

          {switchError ? <Text style={styles.switchError}>{switchError}</Text> : null}

          <SellerSwitchToBuyerCard onPress={handleSwitchToBuyer} loading={switching || roleSwitching} />
        </ScreenContent>
      </ScrollView>
    </DashboardScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  screenContent: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  actions: {
    gap: spacing.sm,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryActionText: {
    flex: 1,
    color: colors.textStrong,
    fontWeight: '700',
    fontSize: 15,
  },
  switchError: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
});
