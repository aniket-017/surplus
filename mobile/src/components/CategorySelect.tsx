import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/src/constants/theme';
import { getCategoryIcon } from '@/src/lib/productFormat';
import { PRODUCT_CATEGORIES } from '@/src/types/product';

type CategorySelectProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const selectedIcon = value ? getCategoryIcon(value) : null;

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <View style={styles.triggerContent}>
          {selectedIcon ? (
            <View style={styles.triggerIconWrap}>
              <Ionicons
                name={selectedIcon as keyof typeof Ionicons.glyphMap}
                size={18}
                color={colors.accent}
              />
            </View>
          ) : null}
          <Text style={[styles.triggerText, !value && styles.placeholder]}>
            {value || 'Select category'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>Select category</Text>
            <ScrollView style={styles.optionsList}>
              {PRODUCT_CATEGORIES.map((option) => {
                const selected = value === option.name;

                return (
                  <Pressable
                    key={option.name}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      onChange(option.name);
                      setOpen(false);
                    }}
                  >
                    <View style={styles.optionContent}>
                      <View style={[styles.optionIconWrap, selected && styles.optionIconWrapSelected]}>
                        <Ionicons
                          name={option.icon as keyof typeof Ionicons.glyphMap}
                          size={18}
                          color={selected ? colors.white : colors.accent}
                        />
                      </View>
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                        {option.name}
                      </Text>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark" size={18} color={colors.accent} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  triggerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    color: colors.textStrong,
    fontSize: 15,
    flex: 1,
  },
  placeholder: {
    color: colors.muted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    maxHeight: '75%',
  },
  sheetTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  optionsList: {
    paddingHorizontal: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconWrapSelected: {
    backgroundColor: colors.accent,
  },
  optionText: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: '700',
  },
});
