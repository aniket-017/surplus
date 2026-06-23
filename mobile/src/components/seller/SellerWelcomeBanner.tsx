import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/src/constants/theme';

type SellerWelcomeBannerProps = {
  name?: string | null;
};

function getDisplayName(name?: string | null) {
  if (name?.trim()) {
    return name.trim().split(' ')[0];
  }
  return 'there';
}

export function SellerWelcomeBanner({ name }: SellerWelcomeBannerProps) {
  const displayName = getDisplayName(name);

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{displayName} 👋</Text>
        <Text style={styles.tagline}>Let&apos;s give surplus a second life 🍃</Text>
      </View>

      <View style={styles.visual}>
        <View style={styles.box}>
          <Ionicons name="leaf" size={18} color="rgba(255,255,255,0.85)" style={styles.leafTop} />
          <View style={styles.recycleCircle}>
            <Ionicons name="reload-circle" size={28} color={colors.white} />
          </View>
          <Ionicons name="cube-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.cubeLeft} />
          <Ionicons name="pricetag-outline" size={18} color="rgba(255,255,255,0.65)" style={styles.tagRight} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F6B42',
    borderRadius: 20,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 140,
  },
  content: {
    flex: 1,
    gap: 4,
    paddingRight: spacing.sm,
  },
  greeting: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 15,
    fontWeight: '500',
  },
  name: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  tagline: {
    color: 'rgba(200, 230, 210, 0.95)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  visual: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 88,
    height: 88,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recycleCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafTop: {
    position: 'absolute',
    top: 10,
    right: 14,
  },
  cubeLeft: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  tagRight: {
    position: 'absolute',
    bottom: 14,
    right: 12,
  },
});
