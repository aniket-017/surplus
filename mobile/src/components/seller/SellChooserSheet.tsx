import { router } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, spacing } from '@/src/constants/theme';

type SellChooserSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const OPTIONS = [
  {
    key: 'product',
    title: 'List surplus product',
    subtitle: 'Machines, material, components or scrap',
    icon: 'cube' as const,
    color: colors.accent,
    tint: 'rgba(92, 179, 53, 0.12)',
    href: '/(seller)/add-product' as const,
  },
  {
    key: 'service',
    title: 'Offer a service',
    subtitle: 'CNC / VMC job work, welding, fabrication, repairs...',
    icon: 'hammer' as const,
    color: '#EA580C',
    tint: 'rgba(234, 88, 12, 0.12)',
    href: '/(seller)/add-service' as const,
  },
];

export function SellChooserSheet({ visible, onClose }: SellChooserSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>What would you like to list?</Text>

          {OPTIONS.map((option) => (
            <Pressable
              key={option.key}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => {
                onClose();
                router.push(option.href);
              }}
              accessibilityRole="button"
              accessibilityLabel={option.title}
            >
              <View style={[styles.optionIcon, { backgroundColor: option.tint }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
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
    backgroundColor: 'rgba(15, 27, 45, 0.15)',
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.textStrong,
    fontSize: 18,
    fontFamily: fonts.extrabold,
    marginBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionPressed: {
    backgroundColor: colors.bgSubtle,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    color: colors.textStrong,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  optionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.medium,
  },
});
