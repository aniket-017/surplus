import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { cardShadow, colors, fonts, spacing } from '@/src/constants/theme';

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
      <Ionicons name="search-outline" size={20} color={colors.muted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Search machines, scrap, motors..."
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        underlineColorAndroid="transparent"
      />
      <View style={styles.divider} />
      <Pressable
        onPress={onFilterPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : 'Open filters'
        }
        style={styles.scanButton}
      >
        <Ionicons name="scan-outline" size={22} color={colors.accent} />
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
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  input: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 14,
    fontFamily: fonts.medium,
    paddingVertical: 0,
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  scanButton: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontFamily: fonts.extrabold,
  },
});
