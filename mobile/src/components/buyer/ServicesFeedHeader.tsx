import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BuyerSearchBar } from '@/src/components/buyer/BuyerSearchBar';
import { ServiceCategoryRail } from '@/src/components/buyer/ServiceCategoryRail';
import { colors, fonts, spacing } from '@/src/constants/theme';
import type { ServiceSortChip, ServicesFeed } from '@/src/hooks/useServicesFeed';
import { SERVICE_MODE_OPTIONS } from '@/src/types/service';

const SERVICE_ORANGE = '#EA580C';

const SORT_CHIPS: { id: ServiceSortChip; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'nearby', label: 'Nearby', icon: 'navigate-outline' },
  { id: 'recent', label: 'Latest', icon: 'time-outline' },
  { id: 'price', label: 'Lowest rate', icon: 'trending-down-outline' },
];

type ServicesFeedHeaderProps = {
  feed: ServicesFeed;
  horizontalPadding: number;
  /** Rendered between the category rail and the listing controls. */
  banner?: ReactNode;
};

export function ServicesFeedHeader({ feed, horizontalPadding, banner }: ServicesFeedHeaderProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const bleed = { marginHorizontal: -horizontalPadding };

  return (
    <View style={styles.container}>
      <BuyerSearchBar
        value={feed.search}
        onChangeText={feed.setSearch}
        onFilterPress={() => setFiltersOpen((open) => !open)}
        activeFilterCount={feed.serviceMode ? 1 : 0}
        placeholder="Search welding, CNC, fabrication..."
      />

      {filtersOpen ? (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Where should the work happen?</Text>
          <View style={styles.chipRow}>
            {[{ value: '' as const, label: 'Any' }, ...SERVICE_MODE_OPTIONS].map((option) => {
              const active = feed.serviceMode === option.value;
              return (
                <Pressable
                  key={option.value || 'any'}
                  style={[styles.modeChip, active && styles.modeChipActive]}
                  onPress={() => feed.setServiceMode(option.value)}
                >
                  <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Service Categories</Text>
        {feed.category ? (
          <Pressable onPress={() => feed.setCategory('')} hitSlop={8}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={bleed}>
        <ServiceCategoryRail
          categories={feed.categories}
          selected={feed.category}
          onSelect={feed.setCategory}
          contentPadding={horizontalPadding}
        />
      </View>

      {banner}

      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="business-outline" size={18} color={colors.textStrong} />
          <Text style={styles.sectionTitle} numberOfLines={1}>
            {feed.category || 'Workshops Near You'}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={bleed}
        contentContainerStyle={[styles.sortRow, { paddingHorizontal: horizontalPadding }]}
      >
        {SORT_CHIPS.map((chip) => {
          const active = feed.sortChip === chip.id;
          return (
            <Pressable
              key={chip.id}
              style={[styles.sortChip, active && styles.sortChipActive]}
              onPress={() => feed.setSortChip(chip.id)}
            >
              <Ionicons name={chip.icon} size={14} color={active ? colors.white : colors.text} />
              <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {feed.error ? <Text style={styles.error}>{feed.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  filterPanel: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  filterLabel: {
    color: colors.muted,
    fontSize: 12.5,
    fontFamily: fonts.semibold,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceMuted,
  },
  modeChipActive: {
    backgroundColor: SERVICE_ORANGE,
  },
  modeChipText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  modeChipTextActive: {
    color: colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -4,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    flexShrink: 1,
    color: colors.textStrong,
    fontSize: 17,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.3,
  },
  clearText: {
    color: SERVICE_ORANGE,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  sortRow: {
    gap: 8,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  sortChipText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  sortChipTextActive: {
    color: colors.white,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.medium,
  },
});
