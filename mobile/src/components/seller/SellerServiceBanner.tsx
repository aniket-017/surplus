import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts } from '@/src/constants/theme';

type SellerServiceBannerProps = {
  onPress: () => void;
};

const JOB_WORK_IMAGE = require('@/assets/images/seller/service-jobwork.png');
const SERVICE_ORANGE = '#EA580C';

export function SellerServiceBanner({ onPress }: SellerServiceBannerProps) {
  return (
    <LinearGradient
      colors={['#FFF8F1', '#FDEBDB', '#F9DCC4']}
      locations={[0, 0.5, 1]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.card}
    >
      <View style={styles.glow} />
      <Image source={JOB_WORK_IMAGE} style={styles.image} contentFit="contain" />

      <View style={styles.tag}>
        <Ionicons name="hammer" size={11} color={colors.white} />
        <Text style={styles.tagText}>SERVICES</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          Offer your job work
        </Text>

        <View style={styles.body}>
          <Text style={styles.subtitle}>
            CNC, welding, fabrication or repairs? List your service and get enquiries.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="List a service"
          >
            <Ionicons name="add-circle" size={16} color={colors.white} />
            <Text style={styles.buttonText}>List a Service</Text>
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
    borderColor: 'rgba(234, 88, 12, 0.12)',
    shadowColor: '#9A3412',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  glow: {
    position: 'absolute',
    left: -40,
    bottom: -70,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  image: {
    position: 'absolute',
    left: -8,
    bottom: 6,
    width: '50%',
    aspectRatio: 640 / 423,
  },
  tag: {
    position: 'absolute',
    top: 14,
    left: 16,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: SERVICE_ORANGE,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    transform: [{ rotate: '6deg' }],
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
    alignItems: 'flex-end',
  },
  title: {
    color: colors.textStrong,
    fontSize: 21,
    lineHeight: 28,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.6,
    width: '52%',
  },
  body: {
    width: '52%',
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
    backgroundColor: SERVICE_ORANGE,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.white,
    fontSize: 13.5,
    fontFamily: fonts.bold,
    letterSpacing: -0.2,
  },
});
