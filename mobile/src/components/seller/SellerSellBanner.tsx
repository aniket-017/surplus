import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts } from '@/src/constants/theme';

type SellerSellBannerProps = {
  onPress: () => void;
};

const CNC_IMAGE = require('@/assets/images/seller/sell-cnc.png');
const DEEP_GREEN = '#17692F';
const LIGHT_GREEN = '#A8EC86';

export function SellerSellBanner({ onPress }: SellerSellBannerProps) {
  return (
    <LinearGradient
      colors={['#0C4520', DEEP_GREEN, '#3F9B3A']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.glow} />
      <Image source={CNC_IMAGE} style={styles.image} contentFit="contain" />

      <View style={styles.tag}>
        <Ionicons name="pricetag" size={11} color={colors.white} />
        <Text style={styles.tagText}>SELL</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          Turn surplus{'\n'}
          <Text style={styles.titleAccent}>into value</Text>
        </Text>
        <Text style={styles.subtitle}>
          Have unused machines, components or material? List it and reach nearby buyers.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="List your surplus"
        >
          <View style={styles.buttonIcon}>
            <Ionicons name="add" size={15} color={colors.white} />
          </View>
          <Text style={styles.buttonText}>List Your Surplus</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.textStrong} />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 188,
    shadowColor: '#0C4520',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 5,
  },
  glow: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  image: {
    position: 'absolute',
    right: -18,
    bottom: 4,
    width: '58%',
    aspectRatio: 640 / 425,
  },
  tag: {
    position: 'absolute',
    top: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    transform: [{ rotate: '-6deg' }],
  },
  tagText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: fonts.extrabold,
    letterSpacing: 0.8,
  },
  content: {
    width: '60%',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    color: colors.white,
    fontSize: 25,
    lineHeight: 30,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.7,
  },
  titleAccent: {
    color: LIGHT_GREEN,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.medium,
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 12,
    marginTop: 14,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DEEP_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textStrong,
    fontSize: 13.5,
    fontFamily: fonts.bold,
    letterSpacing: -0.2,
  },
});
