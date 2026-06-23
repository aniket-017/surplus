import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/src/constants/theme';
import { formatListingPrice, formatPrice } from '@/src/lib/productFormat';
import { getImageUrl } from '@/src/lib/productsApi';
import type { Product } from '@/src/types/product';

type SellerListingCardProps = {
  product: Product;
  onPress: () => void;
  onEdit: () => void;
};

const PRICE_GREEN = '#1B5E20';
const PENDING_ORANGE = '#F57C00';

function getTotalPrice(product: Product) {
  if (
    product.priceType === 'per_kg' ||
    product.priceType === 'per_unit' ||
    product.priceType === 'per_lot'
  ) {
    return product.price * product.quantity;
  }

  return product.price;
}

function getListingStatus(product: Product) {
  if (product.condition === 'refurbished') {
    return { label: 'Pending', tone: 'pending' as const };
  }

  return { label: 'Active', tone: 'active' as const };
}

function getCubeLabel(product: Product) {
  const unit = product.quantityUnit.toLowerCase();

  if (unit === 'kg' || unit === 'ton' || unit === 'ltr' || unit === 'litre') {
    return `${product.quantity} piece`;
  }

  return `${product.quantity} ${product.quantityUnit}`;
}

function showUnitPrice(product: Product) {
  return (
    product.priceType === 'per_kg' ||
    product.priceType === 'per_unit' ||
    product.priceType === 'per_lot'
  );
}

function MetaLine({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.metaLine}>
      <Ionicons name={icon} size={13} color={colors.muted} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

type ListingMenuProps = {
  visible: boolean;
  onClose: () => void;
  onView: () => void;
  onEdit: () => void;
};

function ListingMenu({ visible, onClose, onView, onEdit }: ListingMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.menuBackdrop} onPress={onClose}>
        <Pressable onPress={(event) => event.stopPropagation()}>
          <View style={styles.menuCard}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onView();
              }}
            >
              <Ionicons name="eye-outline" size={18} color={colors.textStrong} />
              <Text style={styles.menuItemText}>View Details</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onEdit();
              }}
            >
              <Ionicons name="create-outline" size={18} color={colors.accent} />
              <Text style={[styles.menuItemText, styles.menuItemTextAccent]}>Edit Listing</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function SellerListingCard({ product, onPress, onEdit }: SellerListingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = getListingStatus(product);
  const totalPrice = getTotalPrice(product);
  const unitPriceLabel = formatListingPrice(product);

  return (
    <>
      <Pressable style={styles.card} onPress={onPress}>
        <View style={styles.imageColumn}>
          {product.images[0] ? (
            <Image
              source={{ uri: getImageUrl(product.images[0]) }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.image, styles.imageFallback]} />
          )}
          <View
            style={[
              styles.statusBadge,
              status.tone === 'active' ? styles.statusBadgeActive : styles.statusBadgePending,
            ]}
          >
            <Text style={styles.statusBadgeText}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {product.title}
            </Text>
            <Pressable
              style={styles.menuButton}
              hitSlop={8}
              onPress={(event) => {
                event.stopPropagation();
                setMenuOpen(true);
              }}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={colors.muted} />
            </Pressable>
          </View>

          <Text style={styles.category} numberOfLines={1}>
            {product.category} / {product.subCategory}
          </Text>

          <View style={styles.detailsRow}>
            <View style={styles.metaBlock}>
              <MetaLine
                icon="bag-outline"
                label={`${product.quantity} ${product.quantityUnit}`}
              />
              <MetaLine icon="cube-outline" label={getCubeLabel(product)} />
              {showUnitPrice(product) ? (
                <MetaLine icon="cash-outline" label={unitPriceLabel} />
              ) : null}
            </View>

            <View style={styles.priceBlock}>
              <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
              <Text style={styles.views}>
                Views {product.viewCount ?? 0}
                {(product.inquiryCount ?? 0) > 0
                  ? ` · ${product.inquiryCount} inquir${product.inquiryCount === 1 ? 'y' : 'ies'}`
                  : ''}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>

      <ListingMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onView={onPress}
        onEdit={onEdit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  imageColumn: {
    position: 'relative',
  },
  image: {
    width: 88,
    height: 100,
    borderRadius: 12,
  },
  imageFallback: {
    backgroundColor: colors.surfaceMuted,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeActive: {
    backgroundColor: colors.accent,
  },
  statusBadgePending: {
    backgroundColor: PENDING_ORANGE,
  },
  statusBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    color: colors.textStrong,
    fontWeight: '800',
    fontSize: 15,
    lineHeight: 20,
  },
  menuButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  category: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 2,
  },
  metaBlock: {
    flex: 1,
    gap: 4,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  priceBlock: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
  totalPrice: {
    color: PRICE_GREEN,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  views: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  menuCard: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
  },
  menuItemText: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '600',
  },
  menuItemTextAccent: {
    color: colors.accent,
    fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
