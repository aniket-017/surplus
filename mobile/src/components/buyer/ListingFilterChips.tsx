import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import type { BrowseSort } from '@/src/types/product';

type FilterOption = {
  id: string;
  label: string;
  sort?: BrowseSort;
  disabled?: boolean;
};

const FILTERS: FilterOption[] = [
  { id: 'all', label: 'All', sort: 'recent' },
  { id: 'near', label: 'Near Me', sort: 'recent' },
  { id: 'price', label: 'Best Price', sort: 'price_asc' },
  { id: 'recent', label: 'Recently Added', sort: 'recent' },
];

type ListingFilterChipsProps = {
  activeFilter: string;
  onChangeFilter: (filterId: string, sort: BrowseSort) => void;
};

export function ListingFilterChips({ activeFilter, onChangeFilter }: ListingFilterChipsProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Popular Listings</Text>
        <Text style={styles.sortHint}>Sort</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.id;

          return (
            <Pressable
              key={filter.id}
              style={[
                styles.chip,
                active && styles.chipActive,
                filter.disabled && styles.chipDisabled,
              ]}
              disabled={filter.disabled}
              onPress={() => onChangeFilter(filter.id, filter.sort || 'recent')}
            >
              <Text
                style={[
                  styles.chipText,
                  active && styles.chipTextActive,
                  filter.disabled && styles.chipTextDisabled,
                ]}
              >
                {filter.label}
              </Text>
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
  title: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  sortHint: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  chip: {
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
  chipDisabled: {
    opacity: 0.45,
  },
  chipText: {
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  chipTextDisabled: {
    color: colors.muted,
  },
});
