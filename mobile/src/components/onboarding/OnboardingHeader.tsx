import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/src/components/Logo';
import { OnboardingStepper } from '@/src/components/onboarding/OnboardingStepper';
import { colors, fonts, spacing } from '@/src/constants/theme';

type OnboardingHeaderProps = {
  stepLabel: string;
  onBack?: () => void;
  backDisabled?: boolean;
  /** Omit to hide the stepper (single-step flows). */
  stepper?: { current: number; labels: string[] };
};

export function OnboardingHeader({ stepLabel, onBack, backDisabled, stepper }: OnboardingHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            disabled={backDisabled}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textStrong} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <Text style={styles.stepLabel}>{stepLabel}</Text>
      </View>

      <Logo size="lg" />

      {stepper ? <OnboardingStepper current={stepper.current} labels={stepper.labels} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  backPressed: {
    opacity: 0.5,
  },
  stepLabel: {
    color: colors.muted,
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
