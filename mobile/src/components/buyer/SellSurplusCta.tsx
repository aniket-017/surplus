import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/src/constants/theme';

type SellSurplusCtaProps = {
  onPress: () => void;
  loading?: boolean;
};

const STEPS = [
  { key: 'photo', icon: 'camera-outline' as const, label: 'Capture Photo' },
  { key: 'price', icon: 'pricetag-outline' as const, label: 'Set Price' },
  { key: 'publish', icon: 'paper-plane-outline' as const, label: 'Publish' },
];

function StepConnector() {
  return (
    <View style={styles.connector}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.connectorDot} />
      ))}
    </View>
  );
}

export function SellSurplusCta({ onPress, loading = false }: SellSurplusCtaProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.banner,
        pressed && styles.bannerPressed,
        loading && styles.bannerDisabled,
      ]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel="Sell your surplus"
    >
      <View style={styles.left}>
        <View style={styles.plusCircle}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="add" size={18} color={colors.white} />
          )}
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Sell Your</Text>
          <Text style={styles.title}>Surplus</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.steps}>
        {STEPS.map((step, index) => (
          <View key={step.key} style={styles.stepCluster}>
            {index > 0 ? <StepConnector /> : null}
            <View style={styles.stepContent}>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon} size={14} color={colors.white} />
              </View>
              <Text style={styles.stepLabel} numberOfLines={2}>
                {index + 1} {step.label}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 12,
    paddingLeft: spacing.sm,
    paddingRight: 6,
    gap: 8,
  },
  bannerPressed: {
    backgroundColor: colors.accentHover,
  },
  bannerDisabled: {
    opacity: 0.8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: 0,
  },
  title: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 17,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  steps: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  stepCluster: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: 0,
  },
  connector: {
    position: 'absolute',
    left: -8,
    top: 12,
    width: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectorDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  stepIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 11,
    textAlign: 'center',
  },
});
