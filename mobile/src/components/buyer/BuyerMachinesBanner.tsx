import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, spacing } from '@/src/constants/theme';

type BuyerMachinesBannerProps = {
  onPress: () => void;
};

const HERO_IMAGE = require('@/assets/images/buyer/hero-shop.jpg');

export function BuyerMachinesBanner({ onPress }: BuyerMachinesBannerProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Explore quality used machines"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image source={HERO_IMAGE} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      <LinearGradient
        colors={['rgba(15, 27, 45, 0.92)', 'rgba(15, 27, 45, 0.55)', 'rgba(15, 27, 45, 0.25)']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Quality Used Machines at Better Prices</Text>
        <Text style={styles.subtitle}>Browse verified surplus from Pune MIDC industries.</Text>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Explore Now</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.textStrong} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 148,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.92,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 6,
    maxWidth: '72%',
  },
  title: {
    color: colors.white,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.medium,
  },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ctaText: {
    color: colors.textStrong,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
});
