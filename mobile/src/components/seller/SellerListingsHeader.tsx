import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/src/constants/theme';

type SellerListingsHeaderProps = {
  totalCount: number;
  onSearchPress: () => void;
};

export function SellerListingsHeader({
  totalCount,
  onSearchPress,
}: SellerListingsHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>My Listings</Text>
        <Text style={styles.subtitle}>
          {totalCount} total listing{totalCount === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.iconButton} onPress={onSearchPress} hitSlop={8}>
          <Ionicons name="search-outline" size={20} color={colors.textStrong} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textStrong,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingTop: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
