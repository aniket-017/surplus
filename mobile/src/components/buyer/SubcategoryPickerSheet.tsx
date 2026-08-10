import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/src/constants/theme';
import type { ProductSubCategory } from '@/src/types/product';

type SubcategoryPickerSheetProps = {
  visible: boolean;
  subCategories: ProductSubCategory[];
  selected: string;
  onClose: () => void;
  onSelect: (name: string) => void;
};

export function SubcategoryPickerSheet({
  visible,
  subCategories,
  selected,
  onClose,
  onSelect,
}: SubcategoryPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return subCategories;
    return subCategories.filter((item) => item.name.toLowerCase().includes(normalized));
  }, [query, subCategories]);

  function handleSelect(name: string) {
    onSelect(name);
    setQuery('');
    onClose();
  }

  function handleClose() {
    setQuery('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={handleClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>Subcategories</Text>
            <Pressable onPress={handleClose} hitSlop={8} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.textStrong} />
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search subcategories"
              placeholderTextColor={colors.muted}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.name}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <Pressable
                style={[styles.row, !selected && styles.rowActive]}
                onPress={() => handleSelect('')}
              >
                <Text style={[styles.rowTitle, !selected && styles.rowTitleActive]}>All</Text>
                <Text style={[styles.rowCount, !selected && styles.rowTitleActive]}>
                  {subCategories.reduce((sum, item) => sum + item.count, 0)}
                </Text>
              </Pressable>
            }
            ListEmptyComponent={
              <Text style={styles.empty}>No subcategories match your search.</Text>
            }
            renderItem={({ item }) => {
              const active = selected === item.name;
              return (
                <Pressable
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => handleSelect(item.name)}
                >
                  <Text style={[styles.rowTitle, active && styles.rowTitleActive]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={[styles.rowCount, active && styles.rowTitleActive]}>{item.count}</Text>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.45)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    maxHeight: '80%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceMuted,
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
  list: {
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowActive: {
    backgroundColor: 'rgba(92, 179, 53, 0.08)',
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderBottomWidth: 0,
  },
  rowTitle: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '600',
  },
  rowTitleActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  rowCount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
