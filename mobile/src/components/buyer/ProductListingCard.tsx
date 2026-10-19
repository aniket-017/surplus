import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { cardShadow, colors, fonts, spacing } from '@/src/constants/theme';
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

function formatCondition(condition?: string) {
  if (!condition) return '';
  return condition.charAt(0).toUpperCase() + condition.slice(1);
}

function buildSpecsLine(product: ProductListing) {
  const parts: string[] = [];
  const condition = formatCondition(product.condition);
  if (condition) parts.push(condition);
  if (product.quantity > 0) {
    const unit = product.quantityUnit?.trim();
    parts.push(unit ? `${product.quantity} ${unit}` : `${product.quantity} Unit`);
  }
  return parts.join(' · ');
}

export function ProductListingCard({
  product,
  width,
  onPress,
  saved = false,
  onToggleSave,
}: ProductListingCardProps) {
  const sellerName = product.seller?.name || 'Seller';
  const specs = buildSpecsLine(product);
  const locationLabel = formatLocationShort(product.location);

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
          {locationLabel ? (
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={10} color={colors.white} />
              <Text style={styles.locationBadgeText} numberOfLines={1}>
                {locationLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>
          {specs ? (
            <Text style={styles.specs} numberOfLines={1}>
              {specs}
            </Text>
          ) : (
            <Text style={styles.specs} numberOfLines={1}>
              {product.category}
            </Text>
          )}
          <Text style={styles.price}>{formatListingPrice(product)}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.muted} />
            <Text style={styles.metaLocation} numberOfLines={1}>
              {locationLabel || 'Location TBA'}
            </Text>
          </View>

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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 128,
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
    top: 8,
    maxWidth: '78%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  locationBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  content: {
    padding: spacing.sm,
    gap: 4,
  },
  title: {
    color: colors.textStrong,
    fontSize: 13.5,
    fontFamily: fonts.bold,
    lineHeight: 18,
    minHeight: 36,
  },
  specs: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  price: {
    color: colors.textStrong,
    fontSize: 15,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaLocation: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.medium,
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
    fontFamily: fonts.extrabold,
  },
  sellerName: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.semibold,
  },
});
