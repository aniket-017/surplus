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

import { CategoryImage } from '@/src/components/CategoryImage';
import { colors, spacing } from '@/src/constants/theme';
import { PRODUCT_CATEGORIES } from '@/src/types/product';

type CategorySelectProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <View style={styles.triggerContent}>
          {value ? (
            <View style={styles.triggerIconWrap}>
              <CategoryImage name={value} style={styles.triggerImage} />
            </View>
          ) : null}
          <Text
            style={[styles.triggerText, !value && styles.placeholder]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
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
                        <CategoryImage name={option.name} style={styles.optionImage} />
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
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  triggerIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 4,
  },
  triggerImage: {
    width: '100%',
    height: '100%',
  },
  triggerText: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  placeholder: {
    color: colors.muted,
    fontWeight: '500',
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
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 5,
  },
  optionIconWrapSelected: {
    backgroundColor: 'rgba(92, 179, 53, 0.16)',
  },
  optionImage: {
    width: '100%',
    height: '100%',
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
