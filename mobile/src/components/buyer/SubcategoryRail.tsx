import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import type { ProductSubCategory } from '@/src/types/product';

const SEE_ALL_THRESHOLD = 8;

type SubcategoryRailProps = {
  subCategories: ProductSubCategory[];
  selected: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (name: string) => void;
  onSeeAll: () => void;
  loading?: boolean;
};

export function SubcategoryRail({
  subCategories,
  selected,
  query,
  onQueryChange,
  onSelect,
  onSeeAll,
  loading = false,
}: SubcategoryRailProps) {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? subCategories.filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    : subCategories;

  const showSeeAll = subCategories.length >= SEE_ALL_THRESHOLD;

  return (
    <View style={styles.wrap}>
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search subcategories"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <Text style={styles.hint}>Loading subcategories…</Text>
      ) : subCategories.length === 0 ? (
        <Text style={styles.hint}>No subcategories yet for this category.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
          keyboardShouldPersistTaps="handled"
        >
          <Chip label="All" active={!selected} onPress={() => onSelect('')} />
          {filtered.map((item) => (
            <Chip
              key={item.name}
              label={item.name}
              count={item.count}
              active={selected === item.name}
              onPress={() => onSelect(item.name)}
            />
          ))}
          {showSeeAll ? (
            <Pressable style={styles.seeAllChip} onPress={onSeeAll}>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.accent} />
            </Pressable>
          ) : null}
          {filtered.length === 0 ? (
            <Text style={styles.noMatch}>No matches</Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function Chip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
        {typeof count === 'number' ? ` (${count})` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 14,
    padding: 0,
  },
  rail: {
    flexDirection: 'row',
    alignItems: 'center',
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
    maxWidth: 220,
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
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
  seeAllChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  seeAllText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
  },
  noMatch: {
    color: colors.muted,
    fontSize: 13,
    paddingHorizontal: 4,
  },
});
