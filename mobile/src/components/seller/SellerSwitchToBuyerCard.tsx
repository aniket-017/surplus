import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/src/constants/theme';

type SellerSwitchToBuyerCardProps = {
  onPress: () => void;
  loading?: boolean;
};

export function SellerSwitchToBuyerCard({ onPress, loading = false }: SellerSwitchToBuyerCardProps) {
  return (
    <Pressable
      style={[styles.card, loading && styles.cardDisabled]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="swap-horizontal-outline" size={22} color={colors.white} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Switch to Buyer</Text>
        <Text style={styles.subtitle}>Browse and buy surplus items</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardDisabled: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
