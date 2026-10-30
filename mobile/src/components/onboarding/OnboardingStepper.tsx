import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/src/constants/theme';

type OnboardingStepperProps = {
  /** Zero-based index of the active step. */
  current: number;
  labels: string[];
};

export function OnboardingStepper({ current, labels }: OnboardingStepperProps) {
  return (
    <View style={styles.row}>
      {labels.map((label, index) => {
        const done = index < current;
        const active = index === current;

        return (
          <View key={label} style={styles.item}>
            {index > 0 ? (
              <View style={styles.track}>
                <View
                  style={[
                    styles.trackFill,
                    { width: index <= current ? '100%' : index === current + 1 ? '50%' : '0%' },
                  ]}
                />
              </View>
            ) : null}
            <View style={styles.step}>
              <View style={[styles.circle, (done || active) && styles.circleActive]}>
                {done ? (
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                ) : (
                  <Text style={styles.number}>{index + 1}</Text>
                )}
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    width: 64,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(15, 27, 45, 0.1)',
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#C9D1DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: colors.accent,
  },
  number: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  labelActive: {
    color: colors.textStrong,
    fontFamily: fonts.semibold,
  },
});
