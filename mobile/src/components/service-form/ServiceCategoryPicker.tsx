import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AiBadge } from '@/src/components/service-form/shared';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import { useMyServices } from '@/src/hooks/useMyServices';
import { getServiceCategories } from '@/src/lib/servicesApi';
import { getServiceCategoryTheme, SERVICE_CATEGORIES } from '@/src/lib/serviceCategories';

const QUICK_PICK_COUNT = 6;

type ServiceCategoryPickerProps = {
  value: string;
  onChange: (category: string) => void;
  aiSuggested?: boolean;
};

export function ServiceCategoryPicker({ value, onChange, aiSuggested }: ServiceCategoryPickerProps) {
  const { token } = useAuth();
  const { services } = useMyServices();
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getServiceCategories(token)
      .then(({ categories }) => {
        if (!cancelled) setCounts(new Map(categories.map((item) => [item.name, item.count ?? 0])));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [token]);

  const recent = useMemo(() => {
    const names: string[] = [];
    for (const service of services) {
      if (service.listingStatus !== 'deleted' && !names.includes(service.category)) {
        names.push(service.category);
      }
    }
    return names.slice(0, 4);
  }, [services]);

  const popular = useMemo(
    () =>
      SERVICE_CATEGORIES.filter((item) => item.name !== 'Others' && !recent.includes(item.name))
        .map((item, index) => ({ item, index, count: counts.get(item.name) ?? 0 }))
        .sort((a, b) => b.count - a.count || a.index - b.index)
        .slice(0, QUICK_PICK_COUNT)
        .map(({ item }) => item.name),
    [counts, recent],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return SERVICE_CATEGORIES;
    return SERVICE_CATEGORIES.filter((item) => item.name.toLowerCase().includes(term));
  }, [query]);

  function select(name: string) {
    onChange(name);
    setSheetOpen(false);
    setQuery('');
  }

  const selectedTheme = value ? getServiceCategoryTheme(value) : null;

  return (
    <View style={styles.wrap}>
      {value && selectedTheme ? (
        <Pressable style={styles.selected} onPress={() => setSheetOpen(true)}>
          <View style={[styles.selectedIcon, { backgroundColor: selectedTheme.tint }]}>
            <Ionicons
              name={selectedTheme.icon as keyof typeof Ionicons.glyphMap}
              size={18}
              color={selectedTheme.color}
            />
          </View>
          <View style={styles.selectedCopy}>
            <Text style={styles.selectedText} numberOfLines={1}>
              {value}
            </Text>
            {aiSuggested ? <AiBadge /> : null}
          </View>
          <Text style={styles.changeText}>Change</Text>
        </Pressable>
      ) : (
        <>
          {recent.length > 0 ? (
            <>
              <Text style={styles.groupLabel}>Your services</Text>
              <View style={styles.grid}>
                {recent.map((name) => (
                  <CategoryTile key={name} name={name} onPress={() => select(name)} />
                ))}
              </View>
            </>
          ) : null}
          <Text style={styles.groupLabel}>Popular</Text>
          <View style={styles.grid}>
            {popular.map((name) => (
              <CategoryTile key={name} name={name} onPress={() => select(name)} />
            ))}
            <Pressable
              style={[styles.tile, styles.allTile]}
              onPress={() => setSheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="All services"
            >
              <View style={[styles.tileIcon, styles.allIcon]}>
                <Ionicons name="grid-outline" size={18} color={colors.navy} />
              </View>
              <Text style={styles.tileText} numberOfLines={2}>
                All services
              </Text>
            </Pressable>
          </View>
        </>
      )}

      <Modal
        visible={sheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>Select service category</Text>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={colors.muted} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search e.g. welding, CNC, painting"
                placeholderTextColor={colors.muted}
                autoCorrect={false}
              />
            </View>
            <ScrollView style={styles.optionsList} keyboardShouldPersistTaps="handled">
              {filtered.map((option) => {
                const selected = value === option.name;
                return (
                  <Pressable
                    key={option.name}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => select(option.name)}
                  >
                    <View style={styles.optionContent}>
                      <View style={[styles.optionIcon, { backgroundColor: option.tint }]}>
                        <Ionicons
                          name={option.icon as keyof typeof Ionicons.glyphMap}
                          size={20}
                          color={option.color}
                        />
                      </View>
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                        {option.name}
                      </Text>
                    </View>
                    {selected ? <Ionicons name="checkmark" size={18} color={colors.accent} /> : null}
                  </Pressable>
                );
              })}
              {!filtered.length ? (
                <Pressable style={styles.option} onPress={() => select('Others')}>
                  <Text style={styles.optionText}>No match. Use "Others"</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function CategoryTile({ name, onPress }: { name: string; onPress: () => void }) {
  const theme = getServiceCategoryTheme(name);
  return (
    <Pressable
      style={styles.tile}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <View style={[styles.tileIcon, { backgroundColor: theme.tint }]}>
        <Ionicons name={theme.icon as keyof typeof Ionicons.glyphMap} size={18} color={theme.color} />
      </View>
      <Text style={styles.tileText} numberOfLines={2}>
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  groupLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tile: {
    flexBasis: '31%',
    flexGrow: 1,
    maxWidth: '33%',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    minHeight: 86,
  },
  allTile: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(15, 27, 45, 0.18)',
  },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allIcon: {
    backgroundColor: colors.white,
  },
  tileText: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
  },
  selectedIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    alignItems: 'flex-start',
  },
  selectedText: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  changeText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    maxHeight: '80%',
  },
  sheetTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textStrong,
  },
  optionsList: {
    paddingHorizontal: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(15, 27, 45, 0.08)',
  },
  optionSelected: {
    backgroundColor: 'rgba(92, 179, 53, 0.06)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: '700',
  },
});
