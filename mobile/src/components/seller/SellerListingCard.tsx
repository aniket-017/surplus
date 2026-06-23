import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import { getImageUrl } from '@/src/lib/productsApi';
import type { Product } from '@/src/types/product';

type SellerListingCardProps = {
  product: Product;
  onPress: () => void;
};

function formatPrice(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatCondition(condition: string) {
  return condition.charAt(0).toUpperCase() + condition.slice(1);
}

export function SellerListingCard({ product, onPress }: SellerListingCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {product.images[0] ? (
        <Image
          source={{ uri: getImageUrl(product.images[0]) }}
          style={styles.image}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>
          <View style={styles.conditionChip}>
            <Text style={styles.conditionChipText}>{formatCondition(product.condition)}</Text>
          </View>
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {product.category} / {product.subCategory}
        </Text>
        <Text style={styles.price}>
          {formatPrice(product.price)} · {product.quantity} {product.quantityUnit}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: 10,
  },
  imageFallback: {
    backgroundColor: colors.surfaceMuted,
  },
  info: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  title: {
    flex: 1,
    color: colors.textStrong,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 20,
  },
  conditionChip: {
    backgroundColor: colors.bgSubtle,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  conditionChipText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  price: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
});
