import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import { formatRelativeDate } from '@/src/lib/productFormat';
import type { ProductListing } from '@/src/types/product';

type QuickStatsRowProps = {
  product: ProductListing;
};

const STATS = [
  { key: 'quantity', icon: 'cube-outline' as const },
  { key: 'location', icon: 'location-outline' as const },
  { key: 'pickup', icon: 'car-outline' as const },
  { key: 'listed', icon: 'calendar-outline' as const },
];

export function QuickStatsRow({ product }: QuickStatsRowProps) {
  function getValue(key: string) {
    switch (key) {
      case 'quantity':
        return `${product.quantity} ${product.quantityUnit}`;
      case 'location':
        return product.location.city;
      case 'pickup':
        return 'Pickup';
      case 'listed':
        return formatRelativeDate(product.createdAt);
      default:
        return '';
    }
  }

  return (
    <View style={styles.strip}>
      {STATS.map((stat, index) => (
        <View key={stat.key} style={styles.statItem}>
          {index > 0 ? <View style={styles.separator} /> : null}
          <View style={styles.statContent}>
            <Ionicons name={stat.icon} size={16} color={colors.accent} />
            <Text style={styles.statValue} numberOfLines={1}>
              {getValue(stat.key)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.border,
    marginRight: spacing.xs,
  },
  statContent: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  statValue: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
