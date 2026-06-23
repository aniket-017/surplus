import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DashboardScreen } from '@/src/components/DashboardShell';
import { Logo } from '@/src/components/Logo';
import { SellerWelcomeBanner } from '@/src/components/seller';
import { useAuth } from '@/src/context/AuthContext';
import { useMyProducts } from '@/src/hooks/useMyProducts';
import { colors, spacing } from '@/src/constants/theme';

export default function SellerDashboardTab() {
  const { user } = useAuth();
  const { products } = useMyProducts();

  return (
    <DashboardScreen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Logo size="sm" />
        </View>

        <SellerWelcomeBanner name={user?.name} />

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Active Listings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.primaryAction}
            onPress={() => router.push('/(seller)/add-product')}
          >
            <Ionicons name="add-circle" size={20} color={colors.white} />
            <Text style={styles.primaryActionText}>Add Product</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryAction}
            onPress={() => router.push('/(seller)/(tabs)/listings')}
          >
            <Ionicons name="list" size={20} color={colors.accent} />
            <Text style={styles.secondaryActionText}>View All Listings</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Ionicons name="bulb-outline" size={22} color={colors.accent} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Grow your reach</Text>
            <Text style={styles.tipText}>
              Add clear photos and accurate quantities to help buyers find your surplus faster.
            </Text>
          </View>
        </View>
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
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statValue: {
    color: colors.textStrong,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    gap: spacing.sm,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryActionText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
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
  tipCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: 'rgba(92, 179, 53, 0.08)',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  tipContent: {
    flex: 1,
    gap: 4,
  },
  tipTitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '800',
  },
  tipText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
