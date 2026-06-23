import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { cardShadow, colors, spacing } from '@/src/constants/theme';
import { formatRelativeDate } from '@/src/lib/productFormat';
import type { ProductListing } from '@/src/types/product';

type QuickStatsRowProps = {
  product: ProductListing;
};

const STATS = [
  { key: 'quantity', icon: 'cube-outline' as const, label: 'Quantity' },
  { key: 'location', icon: 'location-outline' as const, label: 'Location' },
  { key: 'pickup', icon: 'car-outline' as const, label: 'Pickup' },
  { key: 'listed', icon: 'calendar-outline' as const, label: 'Listed' },
];

export function QuickStatsRow({ product }: QuickStatsRowProps) {
  function getValue(key: string) {
    switch (key) {
      case 'quantity':
        return `${product.quantity} ${product.quantityUnit}`;
      case 'location':
        return product.location.city;
      case 'pickup':
        return 'Available';
      case 'listed':
        return formatRelativeDate(product.createdAt);
      default:
        return '';
    }
  }

  return (
    <View style={styles.row}>
      {STATS.map((stat) => (
        <View key={stat.key} style={styles.statCard}>
          <Ionicons name={stat.icon} size={18} color={colors.accent} />
          <Text style={styles.statLabel}>{stat.label}</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {getValue(stat.key)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.sm,
    gap: 4,
    ...cardShadow,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '700',
  },
});
