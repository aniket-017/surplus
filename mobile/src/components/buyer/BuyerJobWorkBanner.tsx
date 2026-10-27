import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts } from '@/src/constants/theme';

type BuyerJobWorkBannerProps = {
  onPress: () => void;
};

const JOB_WORK_IMAGE = require('@/assets/images/seller/service-jobwork.png');
const SERVICE_ORANGE = '#EA580C';

export function BuyerJobWorkBanner({ onPress }: BuyerJobWorkBannerProps) {
  return (
    <LinearGradient
      colors={['#FFF8F1', '#FDEBDB', '#F9DCC4']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.glow} />
      <Image source={JOB_WORK_IMAGE} style={styles.image} contentFit="contain" />

      <View style={styles.content}>
        <Text style={styles.title}>Need parts machined or welded?</Text>
        <Text style={styles.subtitle}>
          Share your drawing and get quotes from nearby workshops.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Find workshops nearby"
        >
          <Ionicons name="navigate" size={14} color={colors.white} />
          <Text style={styles.buttonText}>Find Nearby</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.white} />
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
    minHeight: 156,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.12)',
    shadowColor: '#9A3412',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  glow: {
    position: 'absolute',
    right: -40,
    bottom: -70,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  image: {
    position: 'absolute',
    right: -8,
    bottom: 6,
    width: '50%',
    aspectRatio: 640 / 423,
  },
  content: {
    width: '56%',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  title: {
    color: colors.textStrong,
    fontSize: 18,
    lineHeight: 23,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.medium,
    marginTop: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: SERVICE_ORANGE,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 13,
    marginTop: 12,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fonts.bold,
    letterSpacing: -0.2,
  },
});
