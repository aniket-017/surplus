import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cardShadow, colors, fonts, radius, spacing } from '@/src/constants/theme';

type RoleCardProps = {
  title: string;
  description: string;
  bullets: string[];
  image: ImageSource | number;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  /** Small green badge overlaid on the image corner. */
  badgeIcon?: ComponentProps<typeof Ionicons>['name'];
};

export function RoleCard({
  title,
  description,
  bullets,
  image,
  selected,
  onPress,
  disabled,
  badgeIcon,
}: RoleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.media}>
        <Image source={image} style={styles.image} contentFit="contain" />
        {badgeIcon ? (
          <View style={styles.badge}>
            <Ionicons name={badgeIcon} size={14} color={colors.white} />
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.bullets}>
          {bullets.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <Ionicons name="checkmark" size={15} color={colors.white} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    paddingRight: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 27, 45, 0.08)',
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: '#F3FAEF',
  },
  cardPressed: {
    opacity: 0.94,
  },
  media: {
    width: 118,
    height: 112,
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.textStrong,
    fontFamily: fonts.extrabold,
    fontSize: 18,
    marginRight: 18,
  },
  description: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  bullets: {
    marginTop: 6,
    gap: 5,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bulletText: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 12.5,
  },
  radio: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#B8C2CC',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
});
