import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, spacing } from '@/src/constants/theme';
import type { BrowseSort } from '@/src/types/product';

type FilterOption = {
  id: string;
  label: string;
  sort: BrowseSort;
  icon: keyof typeof Ionicons.glyphMap;
};

const FILTERS: FilterOption[] = [
  { id: 'near', label: 'Nearby', sort: 'recent', icon: 'location-outline' },
  { id: 'recent', label: 'Latest', sort: 'recent', icon: 'time-outline' },
  { id: 'price', label: 'Best Price', sort: 'price_asc', icon: 'cash-outline' },
];

type ListingFilterChipsProps = {
  activeFilter: string;
  onChangeFilter: (filterId: string, sort: BrowseSort) => void;
  onSeeAll?: () => void;
};

export function ListingFilterChips({
  activeFilter,
  onChangeFilter,
  onSeeAll,
}: ListingFilterChipsProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="compass-outline" size={18} color={colors.textStrong} />
          <Text style={styles.title}>Listings Near You</Text>
        </View>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8} accessibilityRole="button">
            <Text style={styles.seeAll}>See all ›</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.id;

          return (
            <Pressable
              key={filter.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChangeFilter(filter.id, filter.sort)}
            >
              <Ionicons
                name={filter.icon}
                size={14}
                color={active ? colors.white : colors.muted}
              />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: colors.textStrong,
    fontSize: 16,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.3,
  },
  seeAll: {
    color: colors.accent,
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  row: {
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    color: colors.textStrong,
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  chipTextActive: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
});
