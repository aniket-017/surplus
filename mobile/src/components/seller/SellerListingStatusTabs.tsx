import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';

export type SellerListingFilter = 'all' | 'active' | 'sold' | 'scrap';

type TabOption = {
  id: SellerListingFilter;
  label: string;
  count: number;
};

type SellerListingStatusTabsProps = {
  activeFilter: SellerListingFilter;
  counts: Record<SellerListingFilter, number>;
  onChange: (filter: SellerListingFilter) => void;
};

export function SellerListingStatusTabs({
  activeFilter,
  counts,
  onChange,
}: SellerListingStatusTabsProps) {
  const tabs: TabOption[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'active', label: 'Active', count: counts.active },
    { id: 'sold', label: 'Sold', count: counts.sold },
    { id: 'scrap', label: 'Scrap', count: counts.scrap },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {tabs.map((tab) => {
        const active = activeFilter === tab.id;
        const showCount = tab.id !== 'all';

        return (
          <Pressable key={tab.id} style={styles.tab} onPress={() => onChange(tab.id)}>
            <View style={styles.tabInner}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              {showCount ? (
                <View style={[styles.countBadge, active && styles.countBadgeActive]}>
                  <Text style={[styles.countText, active && styles.countTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              ) : null}
            </View>
            {active ? <View style={styles.indicator} /> : <View style={styles.indicatorSpacer} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.md,
    paddingRight: spacing.sm,
  },
  tab: {
    gap: 8,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.textStrong,
    fontWeight: '800',
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(92, 179, 53, 0.15)',
  },
  countText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  countTextActive: {
    color: colors.accent,
  },
  indicator: {
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  indicatorSpacer: {
    height: 3,
  },
});
