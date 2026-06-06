import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/src/constants/theme';

export function BuyerHeroBanner() {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.title}>India&apos;s Trusted Marketplace for Surplus Materials</Text>
        <Text style={styles.subtitle}>Buy quality surplus at the best prices.</Text>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Explore Now</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.white} />
        </Pressable>
      </View>
      <View style={styles.visual}>
        <View style={styles.visualCircle}>
          <Ionicons name="cube-outline" size={42} color={colors.accent} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(92, 179, 53, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.navy,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: spacing.xs,
  },
  buttonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  visual: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
