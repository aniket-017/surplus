import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/src/constants/theme';
import { formatListingPrice, formatLocationShort } from '@/src/lib/productFormat';
import { getImageUrl } from '@/src/lib/productsApi';
import type { ProductListing } from '@/src/types/product';

type ProductListingCardProps = {
  product: ProductListing;
  width: number;
  onPress: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
};

export function ProductListingCard({
  product,
  width,
  onPress,
  saved = false,
  onToggleSave,
}: ProductListingCardProps) {
  const sellerName = product.seller?.name || 'Seller';

  return (
    <View style={[styles.card, { width }]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={product.title}>
        <View style={styles.imageWrap}>
          {product.images[0] ? (
            <Image
              source={{ uri: getImageUrl(product.images[0]) }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.image, styles.imageFallback]} />
          )}
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeText} numberOfLines={1}>
              {formatLocationShort(product.location)}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>
          <Text style={styles.category} numberOfLines={1}>
            {product.category}
          </Text>
          <Text style={styles.price}>{formatListingPrice(product)}</Text>

          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerInitial}>{sellerName[0]?.toUpperCase()}</Text>
            </View>
            <Text style={styles.sellerName} numberOfLines={1}>
              {sellerName}
            </Text>
            <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
          </View>
        </View>
      </Pressable>

      {onToggleSave ? (
        <Pressable
          style={[styles.wishlistButton, saved && styles.wishlistButtonActive]}
          hitSlop={10}
          onPress={onToggleSave}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved' : 'Save listing'}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={saved ? colors.accent : colors.textStrong}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 120,
  },
  imageFallback: {
    backgroundColor: colors.surfaceMuted,
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  wishlistButtonActive: {
    backgroundColor: 'rgba(92, 179, 53, 0.18)',
  },
  locationBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    maxWidth: '80%',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  locationBadgeText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    padding: spacing.sm,
    gap: 4,
  },
  title: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    minHeight: 36,
  },
  category: {
    color: colors.muted,
    fontSize: 12,
  },
  price: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sellerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInitial: {
    color: colors.textStrong,
    fontSize: 11,
    fontWeight: '800',
  },
  sellerName: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
});
