import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import type {
  BrowseSort,
  ProductCategory,
  ProductCondition,
} from '@/src/types/product';
import { CONDITION_OPTIONS } from '@/src/types/product';

export type BrowseFilters = {
  category: string;
  sort: BrowseSort;
  nearMe: boolean;
  minPrice: string;
  maxPrice: string;
  condition: ProductCondition | '';
  negotiable: boolean;
};

export const EMPTY_BROWSE_FILTERS: BrowseFilters = {
  category: '',
  sort: 'recent',
  nearMe: false,
  minPrice: '',
  maxPrice: '',
  condition: '',
  negotiable: false,
};

const SORT_OPTIONS: { label: string; value: BrowseSort }[] = [
  { label: 'Recently Added', value: 'recent' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  filters: BrowseFilters;
  categories: ProductCategory[];
  nearMeCity: string;
  onApply: (filters: BrowseFilters) => void;
};

export function countActiveFilters(filters: BrowseFilters): number {
  let count = 0;
  if (filters.category) count += 1;
  if (filters.sort !== 'recent') count += 1;
  if (filters.nearMe) count += 1;
  if (filters.minPrice.trim()) count += 1;
  if (filters.maxPrice.trim()) count += 1;
  if (filters.condition) count += 1;
  if (filters.negotiable) count += 1;
  return count;
}

export function FilterModal({
  visible,
  onClose,
  filters,
  categories,
  nearMeCity,
  onApply,
}: FilterModalProps) {
  const [draft, setDraft] = useState<BrowseFilters>(filters);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
    }
  }, [visible, filters]);

  function updateDraft<K extends keyof BrowseFilters>(key: K, value: BrowseFilters[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setDraft(EMPTY_BROWSE_FILTERS);
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <Text style={styles.title}>Filters</Text>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={colors.textStrong} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category</Text>
                <View style={styles.chipRow}>
                  <Chip
                    label="All"
                    active={!draft.category}
                    onPress={() => updateDraft('category', '')}
                  />
                  {categories.map((category) => (
                    <Chip
                      key={category.name}
                      label={category.name}
                      active={draft.category === category.name}
                      onPress={() => updateDraft('category', category.name)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sort by</Text>
                <View style={styles.chipRow}>
                  {SORT_OPTIONS.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      active={draft.sort === option.value}
                      onPress={() => updateDraft('sort', option.value)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location</Text>
                <View style={styles.chipRow}>
                  <Chip
                    label="All India"
                    active={!draft.nearMe}
                    onPress={() => updateDraft('nearMe', false)}
                  />
                  <Chip
                    label={nearMeCity ? `Near Me (${nearMeCity})` : 'Near Me'}
                    active={draft.nearMe}
                    onPress={() => updateDraft('nearMe', true)}
                  />
                </View>
                {draft.nearMe && !nearMeCity ? (
                  <Text style={styles.hint}>
                    Set your location from the header to filter nearby listings.
                  </Text>
                ) : null}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Price range (₹)</Text>
                <View style={styles.priceRow}>
                  <TextInput
                    style={styles.priceInput}
                    value={draft.minPrice}
                    onChangeText={(value) => updateDraft('minPrice', value.replace(/[^0-9.]/g, ''))}
                    placeholder="Min"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                  />
                  <Text style={styles.priceDash}>–</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={draft.maxPrice}
                    onChangeText={(value) => updateDraft('maxPrice', value.replace(/[^0-9.]/g, ''))}
                    placeholder="Max"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Condition</Text>
                <View style={styles.chipRow}>
                  <Chip
                    label="Any"
                    active={!draft.condition}
                    onPress={() => updateDraft('condition', '')}
                  />
                  {CONDITION_OPTIONS.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      active={draft.condition === option.value}
                      onPress={() => updateDraft('condition', option.value)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextWrap}>
                  <Text style={styles.sectionTitle}>Negotiable only</Text>
                  <Text style={styles.hint}>Show listings marked as negotiable</Text>
                </View>
                <Switch
                  value={draft.negotiable}
                  onValueChange={(value) => updateDraft('negotiable', value)}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.white}
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable style={styles.resetButton} onPress={handleReset}>
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
              <Pressable style={styles.applyButton} onPress={handleApply}>
                <Text style={styles.applyText}>Apply filters</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    maxHeight: '90%',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    maxHeight: '100%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
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
  chipText: {
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    color: colors.textStrong,
    fontSize: 14,
  },
  priceDash: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  toggleTextWrap: {
    flex: 1,
    gap: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  resetButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  resetText: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  applyButton: {
    flex: 2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  applyText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
