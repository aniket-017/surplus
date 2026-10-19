import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { cardShadow, colors, fonts, spacing } from '@/src/constants/theme';
import { formatListingPrice } from '@/src/lib/productFormat';
import { getImageUrl } from '@/src/lib/productsApi';
import type { ListingStatus, Product } from '@/src/types/product';

type SellerMyListingsRailProps = {
  products: Product[];
  loading?: boolean;
  onSeeAll: () => void;
  onOpenProduct: (productId: string) => void;
  onAddProduct: () => void;
};

const MAX_ITEMS = 10;
const CARD_WIDTH = 140;
const PRICE_GREEN = '#1B7A34';

const STATUS_STYLES: Record<ListingStatus, { label: string; bg: string }> = {
  active: { label: 'Active', bg: colors.accent },
  sold: { label: 'Sold', bg: '#1565C0' },
  deleted: { label: 'Deleted', bg: '#607D8B' },
};

function ListingTile({ product, onPress }: { product: Product; onPress: () => void }) {
  const status = STATUS_STYLES[product.listingStatus ?? 'active'];

  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={product.title}
    >
      <View>
        {product.images[0] ? (
          <Image
            source={{ uri: getImageUrl(product.images[0]) }}
            style={styles.tileImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.tileImage, styles.tileImageFallback]}>
            <Ionicons name="image-outline" size={24} color={colors.muted} />
          </View>
        )}
        <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
          <Text style={styles.statusText}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.tileBody}>
        <Text style={styles.tileTitle} numberOfLines={1}>
          {product.title}
        </Text>
        <View style={styles.tileLocation}>
          <Ionicons name="location-sharp" size={11} color={colors.accent} />
          <Text style={styles.tileLocationText} numberOfLines={1}>
            {product.location.city}
          </Text>
        </View>
        <Text style={styles.tilePrice} numberOfLines={1}>
          {formatListingPrice(product)}
        </Text>
      </View>
    </Pressable>
  );
}

export function SellerMyListingsRail({
  products,
  loading = false,
  onSeeAll,
  onOpenProduct,
  onAddProduct,
}: SellerMyListingsRailProps) {
  const visible = products
    .filter((product) => product.listingStatus !== 'deleted')
    .slice(0, MAX_ITEMS);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>My Listings</Text>
        {visible.length > 0 ? (
          <Pressable style={styles.link} onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.linkText}>See All</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.navy} />
          </Pressable>
        ) : null}
      </View>

      {loading && visible.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : visible.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            You have no listings yet. Add your first surplus item to reach nearby buyers.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.emptyButton, pressed && styles.tilePressed]}
            onPress={onAddProduct}
          >
            <Ionicons name="add" size={16} color={colors.white} />
            <Text style={styles.emptyButtonText}>Add your first listing</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
          {visible.map((product) => (
            <ListingTile
              key={product.id}
              product={product}
              onPress={() => onOpenProduct(product.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  title: {
    color: colors.textStrong,
    fontSize: 16,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.3,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkText: {
    color: colors.navy,
    fontSize: 12,
    fontFamily: fonts.semibold,
  },
  rail: {
    paddingHorizontal: spacing.md,
    gap: 10,
  },
  tile: {
    width: CARD_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  tilePressed: {
    opacity: 0.85,
  },
  tileImage: {
    width: '100%',
    height: 96,
  },
  tileImageFallback: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChip: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusText: {
    color: colors.white,
    fontSize: 9,
    fontFamily: fonts.bold,
  },
  tileBody: {
    padding: 8,
    gap: 3,
  },
  tileTitle: {
    color: colors.textStrong,
    fontSize: 12.5,
    fontFamily: fonts.bold,
  },
  tileLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tileLocationText: {
    flex: 1,
    color: colors.muted,
    fontSize: 10.5,
    fontFamily: fonts.medium,
  },
  tilePrice: {
    color: PRICE_GREEN,
    fontSize: 14,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.2,
  },
  loading: {
    paddingVertical: spacing.lg,
  },
  empty: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.medium,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
});
