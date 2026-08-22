import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
          placeholder="Search products"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          underlineColorAndroid="transparent"
        />
      </View>
      <Pressable style={styles.filterButton} onPress={onFilterPress}>
        <Ionicons name="options-outline" size={16} color={colors.textStrong} />
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
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 8,
    minHeight: 42,
  },
  input: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.textStrong,
    paddingVertical: 0,
    paddingHorizontal: 0,
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
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
    minHeight: 42,
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
