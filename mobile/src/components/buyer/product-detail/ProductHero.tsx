import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { cardShadow, colors, spacing } from '@/src/constants/theme';
import {
  formatListingPrice,
  formatListedDate,
  formatLocationShort,
  formatRelativeDate,
} from '@/src/lib/productFormat';
import type { ProductListing } from '@/src/types/product';

type ProductHeroProps = {
  product: ProductListing;
};

export function ProductHero({ product }: ProductHeroProps) {
  const isNegotiable = product.priceType === 'negotiable';

  return (
    <View style={styles.card}>
      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{product.category}</Text>
        </View>
        <View style={[styles.chip, styles.chipMuted]}>
          <Text style={styles.chipTextMuted}>{product.subCategory}</Text>
        </View>
      </View>

      <Text style={styles.title}>{product.title}</Text>

      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={14} color={colors.muted} />
        <Text style={styles.metaText}>Listed {formatRelativeDate(product.createdAt)}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Ionicons name="location-outline" size={14} color={colors.muted} />
        <Text style={styles.metaText}>{formatLocationShort(product.location)}</Text>
      </View>

      <View style={styles.priceBlock}>
        <Text style={styles.price}>{formatListingPrice(product)}</Text>
        {isNegotiable ? (
          <View style={styles.negotiableBadge}>
            <Text style={styles.negotiableText}>Price Negotiable</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.availability}>
        {product.quantity} {product.quantityUnit} Available
      </Text>
      <Text style={styles.postedDate}>Posted {formatListedDate(product.createdAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
    ...cardShadow,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipMuted: {
    backgroundColor: colors.surfaceMuted,
  },
  chipText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextMuted: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: colors.textStrong,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  metaDot: {
    color: colors.muted,
    fontSize: 13,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 4,
  },
  price: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  negotiableBadge: {
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  negotiableText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  availability: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  postedDate: {
    color: colors.muted,
    fontSize: 13,
  },
});
