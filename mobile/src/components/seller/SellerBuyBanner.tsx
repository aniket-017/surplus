import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts } from '@/src/constants/theme';

type SellerBuyBannerProps = {
  onPress: () => void;
  loading?: boolean;
};

const PARTS_IMAGE = require('@/assets/images/seller/buy-parts.png');
const BUY_BLUE = '#2563EB';

export function SellerBuyBanner({ onPress, loading = false }: SellerBuyBannerProps) {
  return (
    <LinearGradient
      colors={['#F5F9FF', '#E4EEFC', '#D2E2F8']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.glow} />
      <Image source={PARTS_IMAGE} style={styles.image} contentFit="contain" />

      <View style={styles.tag}>
        <Ionicons name="pricetag" size={11} color={colors.white} />
        <Text style={styles.tagText}>BUY</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          Looking for something?
        </Text>

        <View style={styles.body}>
          <Text style={styles.subtitle}>
            Find machines, material & components from nearby industries.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={onPress}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Explore surplus as a buyer"
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="search" size={15} color={colors.white} />
            )}
            <Text style={styles.buttonText}>Explore Surplus</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 168,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.1)',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  glow: {
    position: 'absolute',
    right: -30,
    bottom: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  image: {
    position: 'absolute',
    right: -14,
    bottom: 6,
    width: '54%',
    aspectRatio: 640 / 297,
  },
  tag: {
    position: 'absolute',
    top: 58,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BUY_BLUE,
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    color: colors.textStrong,
    fontSize: 21,
    lineHeight: 28,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.6,
  },
  body: {
    width: '56%',
  },
  subtitle: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.medium,
    marginTop: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 13.5,
    fontFamily: fonts.bold,
    letterSpacing: -0.2,
  },
});
