import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import { formatListingPrice, formatPrice } from '@/src/lib/productFormat';
import type { ProductListing } from '@/src/types/product';

import { SectionCard } from './SectionCard';

type MarketRateCardProps = {
  product: ProductListing;
  range: { min: number; max: number } | null;
};

export function MarketRateCard({ product, range }: MarketRateCardProps) {
  if (!range) return null;

  return (
    <SectionCard title="Market Rate" subtitle="Compared to similar listings">
      <View style={styles.row}>
        <View style={styles.block}>
          <Text style={styles.label}>Market Range</Text>
          <Text style={styles.range}>
            {formatPrice(range.min)} – {formatPrice(range.max)}
            {product.priceType === 'per_kg' ? '/kg' : ''}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.block}>
          <Text style={styles.label}>Your Price</Text>
          <Text style={styles.yourPrice}>{formatListingPrice(product)}</Text>
        </View>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  block: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  range: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '700',
  },
  yourPrice: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
});
