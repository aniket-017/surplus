import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius } from '@/src/constants/theme';

type OtpBoxesProps = {
  value: string;
  onChangeText: (value: string) => void;
  onFocus?: TextInputProps['onFocus'];
  length?: number;
};

function OtpCell({ char, active }: { char: string; active: boolean }) {
  const focus = useSharedValue(active ? 1 : 0);
  const pop = useSharedValue(1);
  const caret = useSharedValue(1);

  useEffect(() => {
    focus.value = withTiming(active ? 1 : 0, { duration: 180 });
  }, [active, focus]);

  useEffect(() => {
    if (char) {
      pop.value = withSequence(
        withTiming(1.12, { duration: 90 }),
        withSpring(1, { damping: 9, stiffness: 260 }),
      );
    }
  }, [char, pop]);

  useEffect(() => {
    caret.value = 1;
    caret.value = withRepeat(
      withTiming(0, { duration: 520, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [caret]);

  const cellStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      [char ? 'rgba(92, 179, 53, 0.45)' : 'rgba(15, 27, 45, 0.12)', colors.accent],
    ),
    backgroundColor: char ? '#F2FAEE' : interpolateColor(focus.value, [0, 1], ['#F6F8FA', '#FFFFFF']),
    transform: [{ scale: pop.value }],
  }));

  const caretStyle = useAnimatedStyle(() => ({ opacity: caret.value }));

  return (
    <Animated.View style={[styles.cell, cellStyle]}>
      {char ? (
        <Text style={styles.char}>{char}</Text>
      ) : active ? (
        <Animated.View style={[styles.caret, caretStyle]} />
      ) : null}
    </Animated.View>
  );
}

export function OtpBoxes({ value, onChangeText, onFocus, length = 6 }: OtpBoxesProps) {
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, i) => (
        <OtpCell key={i} char={value[i] ?? ''} active={focused && i === activeIndex} />
      ))}
      <TextInput
        style={styles.hiddenInput}
        value={value}
        onChangeText={onChangeText}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        importantForAutofill="yes"
        caretHidden
        contextMenuHidden
        autoFocus
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cell: {
    flex: 1,
    maxWidth: 64,
    aspectRatio: 0.86,
    borderWidth: 1.5,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  char: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textStrong,
  },
  caret: {
    width: 2,
    height: 24,
    borderRadius: 1,
    backgroundColor: colors.accent,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    opacity: 0.02,
  },
});
