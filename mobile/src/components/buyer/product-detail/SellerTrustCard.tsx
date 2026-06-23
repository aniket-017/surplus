import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/src/constants/theme';
import { formatMemberSince } from '@/src/lib/productFormat';
import { getImageUrl } from '@/src/lib/productsApi';
import type { ProductSeller } from '@/src/types/product';

import { SectionCard } from './SectionCard';

type SellerTrustCardProps = {
  seller: ProductSeller | null;
};

export function SellerTrustCard({ seller }: SellerTrustCardProps) {
  if (!seller) return null;

  const sellerName = seller.name || 'Seller';
  const initial = sellerName[0]?.toUpperCase() || 'S';

  return (
    <SectionCard title="Seller" subtitle="Seller on Surplus">
      <View style={styles.row}>
        {seller.avatarUrl ? (
          <Image source={{ uri: getImageUrl(seller.avatarUrl) }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.initial}>{initial}</Text>
          </View>
        )}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{sellerName}</Text>
            <Ionicons name="shield-checkmark" size={16} color={colors.accent} />
          </View>
          {seller.memberSince ? (
            <Text style={styles.memberSince}>
              Member since {formatMemberSince(seller.memberSince)}
            </Text>
          ) : null}
        </View>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: colors.textStrong,
    fontSize: 17,
    fontWeight: '800',
  },
  memberSince: {
    color: colors.muted,
    fontSize: 13,
  },
});
