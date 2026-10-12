import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing } from '@/src/constants/theme';

type PhoneFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  valid: boolean;
  onFocus?: TextInputProps['onFocus'];
};

export function PhoneField({ value, onChangeText, valid, onFocus }: PhoneFieldProps) {
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);
  const check = useSharedValue(valid ? 1 : 0);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: 220 });
  }, [focus, focused]);

  useEffect(() => {
    check.value = valid
      ? withSpring(1, { damping: 10, stiffness: 220 })
      : withTiming(0, { duration: 150 });
  }, [check, valid]);

  const fieldStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.value, [0, 1], ['rgba(15, 27, 45, 0.12)', colors.accent]),
    backgroundColor: interpolateColor(focus.value, [0, 1], ['#F6F8FA', '#FFFFFF']),
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    transform: [{ scale: interpolate(focus.value, [0, 1], [0.97, 1]) }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: check.value,
    transform: [{ scale: check.value }, { rotate: `${(1 - check.value) * -90}deg` }],
  }));

  return (
    <View>
      <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />
      <Animated.View style={[styles.field, fieldStyle]}>
        <View style={styles.country}>
          <Text style={styles.flag}>🇮🇳</Text>
          <Text style={styles.countryCode}>+91</Text>
        </View>
        <View style={styles.divider} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={() => setFocused(false)}
          placeholder="Mobile number"
          placeholderTextColor="#9AA6B2"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          importantForAutofill="yes"
          selectionColor={colors.accent}
        />
        <Animated.View style={[styles.check, checkStyle]}>
          <Text style={styles.checkMark}>✓</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: radius.md + 6,
    backgroundColor: 'rgba(92, 179, 53, 0.14)',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md + 2,
    paddingHorizontal: spacing.sm,
    minHeight: 58,
  },
  country: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  flag: {
    fontSize: 18,
  },
  countryCode: {
    color: colors.textStrong,
    fontWeight: '700',
    fontSize: 16,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(15, 27, 45, 0.12)',
    marginHorizontal: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.textStrong,
    letterSpacing: 1,
    paddingVertical: 14,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  checkMark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
});
