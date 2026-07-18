import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/src/constants/theme';
import { formatListingPrice } from '@/src/lib/productFormat';
import type { ProductListing } from '@/src/types/product';

type StickyActionBarProps = {
  product: ProductListing;
  saved: boolean;
  saving: boolean;
  submitting: boolean;
  onSave: () => void;
  onInquiry: () => void;
};

export function StickyActionBar({
  product,
  saved,
  saving,
  submitting,
  onSave,
  onInquiry,
}: StickyActionBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.summary}>
        <Text style={styles.price}>{formatListingPrice(product)}</Text>
        <Text style={styles.qty}>
          {product.quantity} {product.quantityUnit} available
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onSave}
          disabled={saving}
          style={[styles.iconButton, saved && styles.iconButtonActive]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved' : 'Save listing'}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={saved ? colors.accent : colors.textStrong}
            />
          )}
        </Pressable>
        <Pressable
          onPress={onInquiry}
          disabled={submitting}
          style={[styles.primaryButton, submitting && styles.primaryDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Send inquiry"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.primaryText}>Send Inquiry</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summary: {
    flex: 1,
    gap: 2,
  },
  price: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  qty: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 128,
    alignItems: 'center',
  },
  primaryDisabled: {
    opacity: 0.7,
  },
  primaryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
