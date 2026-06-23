import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DashboardScreen } from '@/src/components/DashboardShell';
import { Logo } from '@/src/components/Logo';
import {
  SellerAddProductCard,
  SellerDashboardStats,
  SellerSwitchToBuyerCard,
  SellerWelcomeBanner,
} from '@/src/components/seller';
import { useAuth } from '@/src/context/AuthContext';
import { useMyProducts } from '@/src/hooks/useMyProducts';
import { colors, spacing } from '@/src/constants/theme';
import { getSellerEstimatedValue } from '@/src/lib/productFormat';

export default function SellerDashboardTab() {
  const { user, setRole } = useAuth();
  const { products } = useMyProducts();
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState('');

  const estimatedValue = useMemo(() => getSellerEstimatedValue(products), [products]);

  async function handleSwitchToBuyer() {
    setSwitching(true);
    setSwitchError('');

    try {
      await setRole('buyer');
      router.replace('/(buyer)/(tabs)');
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : 'Failed to switch to buyer');
    } finally {
      setSwitching(false);
    }
  }

  return (
    <DashboardScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Logo size="sm" />
        </View>

        <SellerWelcomeBanner name={user?.name} />

        <SellerDashboardStats
          activeListings={products.length}
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

        <SellerSwitchToBuyerCard onPress={handleSwitchToBuyer} loading={switching} />
      </ScrollView>
    </DashboardScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
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
