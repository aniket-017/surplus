import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/src/constants/theme';

type BuyerSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  onFilterPress?: () => void;
  activeFilterCount?: number;
};

export function BuyerSearchBar({
  value,
  onChangeText,
  onFilterPress,
  activeFilterCount = 0,
}: BuyerSearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="Search materials, products or sellers..."
          placeholderTextColor={colors.muted}
        />
      </View>
      <Pressable style={styles.filterButton} onPress={onFilterPress}>
        <Ionicons name="options-outline" size={18} color={colors.textStrong} />
        <Text style={styles.filterText}>Filters</Text>
        {activeFilterCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeFilterCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textStrong,
    paddingVertical: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  filterText: {
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
